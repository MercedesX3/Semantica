from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.book import Book
from app.models.book_dna import BookDNA
from app.schemas.recommendation import (
    RecommendationItem,
    SimilarBooksResponse,
    ForMeRequest,
    ForMeResponse,
)
from app.services.recommendation_service import similar_books, recommend_for_user

router = APIRouter()


@router.get("/books/{book_id}", response_model=SimilarBooksResponse)
def get_similar_books(
    book_id: int,
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    dna = db.query(BookDNA).filter_by(book_id=book_id).first()
    if dna is None:
        raise HTTPException(
            status_code=409,
            detail="Book DNA not ready yet. Analysis may still be running; poll GET /themes/jobs/{id}.",
        )

    results = similar_books(db, book_id, limit)
    return SimilarBooksResponse(
        book_id=book_id,
        results=[RecommendationItem(**r) for r in results],
    )


@router.post("/for-me", response_model=ForMeResponse)
def recommend_for_me(body: ForMeRequest, db: Session = Depends(get_db)):
    results = recommend_for_user(
        db,
        liked_book_ids=body.liked_book_ids,
        disliked_book_ids=body.disliked_book_ids,
        limit=body.limit,
    )
    if not results:
        raise HTTPException(
            status_code=409,
            detail="No DNA available for the provided liked books. Ensure they are ingested and analyzed.",
        )
    return ForMeResponse(results=[RecommendationItem(**r) for r in results])
