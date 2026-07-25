from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.book import Book
from app.schemas.playlist import BookPlaylistResponse, PlaylistSummary
from app.services.playlist_service import build_book_playlist, list_playlist_summaries

router = APIRouter()


@router.get("/", response_model=list[PlaylistSummary])
def list_playlists(db: Session = Depends(get_db)):
    """Summary cards for every book that has completed chunk analysis."""
    return [PlaylistSummary(**s) for s in list_playlist_summaries(db)]


@router.get("/books/{book_id}", response_model=BookPlaylistResponse)
def get_book_playlist(
    book_id: int,
    tracks_per_chapter: int = Query(default=3, ge=1, le=10),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    try:
        data = build_book_playlist(db, book_id, tracks_per_chapter=tracks_per_chapter)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e

    return BookPlaylistResponse(**data)
