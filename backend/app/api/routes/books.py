from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
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


@router.get("/", response_model=list[BookSummary])
def list_books(db: Session = Depends(get_db)):
    return db.query(Book).all()


@router.post("/ingest", response_model=IngestResponse, status_code=201)
def ingest_book(body: IngestRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    book = Book(title=body.title, author=body.author, raw_text=body.text)
    db.add(book)
    db.flush()  # get book.id without committing

    chunk_specs = chunk_text_by_chapter(body.text)
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
