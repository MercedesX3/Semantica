import io

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
)
from pypdf import PdfReader
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.database import get_db
from app.models.book import Book, BookChunk
from app.models.analysis_job import BookAnalysisJob
from app.schemas.book import (
    IngestRequest,
    IngestResponse,
    BookSummary,
    SearchResponse,
    SearchResultItem,
    BookDetailsResponse,
)
from app.services.text_processing_service import chunk_text_by_chapter
from app.services.embedding_service import embed_chunks
from app.services.analysis_job_service import run_dna_pipeline_job
from app.services.book_detail_service import get_book_details
from app.ml.embedding_pipeline import get_embedding

router = APIRouter()

# Ingestion runs embeddings in-request, so uploads are bounded. A full novel is
# comfortably under these limits; anything larger is almost certainly a mistake.
MAX_PDF_BYTES = 40 * 1024 * 1024
MAX_INGEST_CHARS = 5_000_000
MIN_INGEST_CHARS = 100


@router.get("/", response_model=list[BookSummary])
def list_books(db: Session = Depends(get_db)):
    return db.query(Book).all()


def _ingest_text(
    db: Session,
    background_tasks: BackgroundTasks,
    title: str,
    author: str,
    text: str,
) -> IngestResponse:
    """Chunk, embed, and store a book, then queue the DNA pipeline.

    Shared by the JSON and PDF ingest routes so both paths produce identical
    chunking, embeddings, and background analysis.
    """
    book = Book(title=title, author=author, raw_text=text)
    db.add(book)
    db.flush()  # get book.id without committing

    chunk_specs = chunk_text_by_chapter(text)
    if not chunk_specs:
        db.rollback()
        raise HTTPException(status_code=400, detail="No readable text found in this book.")

    embeddings = embed_chunks([spec["text"] for spec in chunk_specs])

    chunk_rows = [
        BookChunk(
            book_id=book.id,
            chunk_index=spec["chunk_index"],
            chapter_index=spec["chapter_index"],
            chapter_title=spec["chapter_title"],
            text=spec["text"],
            word_count=len(spec["text"].split()),
            embedding=embedding,
        )
        for spec, embedding in zip(chunk_specs, embeddings)
    ]
    db.add_all(chunk_rows)
    book.chunk_count = len(chunk_specs)

    # Heavy DNA extraction (emotion + themes + aggregation) runs in the
    # background so ingest returns immediately; poll GET /themes/jobs/{id}.
    job = BookAnalysisJob(book_id=book.id, status="pending")
    db.add(job)
    db.commit()

    background_tasks.add_task(run_dna_pipeline_job, job.id, book.id)

    return IngestResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        chunk_count=book.chunk_count,
        analysis_job_id=job.id,
        message="Book ingested; DNA analysis running in background",
    )


@router.post("/ingest", response_model=IngestResponse, status_code=201)
def ingest_book(body: IngestRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return _ingest_text(db, background_tasks, body.title, body.author, body.text)


@router.post("/ingest-pdf", response_model=IngestResponse, status_code=201)
async def ingest_book_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(..., min_length=1, max_length=500),
    author: str = Form(..., min_length=1, max_length=300),
    db: Session = Depends(get_db),
):
    """Ingest a book from an uploaded PDF.

    The extracted text goes through the same pipeline as JSON ingest, so the
    resulting DNA is identical to a text upload of the same book.
    """
    if file.content_type not in (None, "application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=415, detail="Please upload a PDF file.")

    raw = await file.read()
    if len(raw) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"PDF is too large (max {MAX_PDF_BYTES // (1024 * 1024)}MB).",
        )

    try:
        reader = PdfReader(io.BytesIO(raw))
        text = "\n\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except Exception:
        raise HTTPException(status_code=400, detail="Couldn't read that PDF — it may be corrupted.")

    if len(text) < MIN_INGEST_CHARS:
        # Almost always a scanned/image-only PDF with no embedded text layer.
        raise HTTPException(
            status_code=422,
            detail=(
                "No selectable text found in this PDF. Scanned or image-only "
                "PDFs need OCR before they can be analysed."
            ),
        )

    return _ingest_text(db, background_tasks, title, author, text[:MAX_INGEST_CHARS])


@router.get("/search", response_model=SearchResponse)
def search_books(
    q: str = Query(..., min_length=1),
    k: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    query_vector = get_embedding(q)

    sql = text("""
        SELECT * FROM (
            SELECT bc.book_id, bc.chunk_index, bc.text,
                   1 - (bc.embedding <=> CAST(:vec AS vector)) AS similarity,
                   b.title, b.author
            FROM book_chunks bc
            JOIN books b ON bc.book_id = b.id
        ) ranked
        WHERE similarity >= :threshold
        ORDER BY similarity DESC
        LIMIT :k
    """)
    rows = db.execute(
        sql, {"vec": str(query_vector), "k": k, "threshold": settings.SEARCH_SIMILARITY_THRESHOLD}
    ).fetchall()

    results = [
        SearchResultItem(
            book_id=row.book_id,
            title=row.title,
            author=row.author,
            chunk_text=row.text,
            chunk_index=row.chunk_index,
            similarity=round(float(row.similarity), 4),
        )
        for row in rows
    ]

    return SearchResponse(query=q, results=results)


@router.get("/{book_ref}", response_model=BookDetailsResponse)
def get_book(book_ref: str, db: Session = Depends(get_db)):
    """Detail for an ingested book (numeric id) or an Open Library work key."""
    details = get_book_details(db, book_ref)
    if not details:
        raise HTTPException(status_code=404, detail="Book not found")
    return BookDetailsResponse(**details)
