from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.database import get_db
from app.models.book import Book, BookChunk
from app.schemas.book import IngestRequest, IngestResponse, BookSummary, SearchResponse, SearchResultItem
from app.services.text_processing_service import chunk_text
from app.services.embedding_service import embed_chunks
from app.ml.embedding_pipeline import get_embedding

router = APIRouter()


@router.get("/", response_model=list[BookSummary])
def list_books(db: Session = Depends(get_db)):
    return db.query(Book).all()


@router.post("/ingest", response_model=IngestResponse, status_code=201)
def ingest_book(body: IngestRequest, db: Session = Depends(get_db)):
    book = Book(title=body.title, author=body.author, raw_text=body.text)
    db.add(book)
    db.flush()  # get book.id without committing

    chunks = chunk_text(body.text)
    embeddings = embed_chunks(chunks)

    chunk_rows = [
        BookChunk(
            book_id=book.id,
            chunk_index=i,
            text=chunk,
            word_count=len(chunk.split()),
            embedding=embedding,
        )
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
    ]
    db.add_all(chunk_rows)
    book.chunk_count = len(chunks)
    db.commit()

    return IngestResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        chunk_count=book.chunk_count,
        message="Book ingested successfully",
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
