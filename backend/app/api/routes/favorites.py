from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.favorite_book import FavoriteBook
from app.schemas.favorite import FavoriteBookCreate, FavoriteBookResponse

router = APIRouter()


@router.get("/", response_model=list[FavoriteBookResponse])
def list_favorites(db: Session = Depends(get_db)):
    return db.query(FavoriteBook).order_by(FavoriteBook.created_at.desc()).all()


@router.post("/", response_model=FavoriteBookResponse, status_code=201)
def add_favorite(body: FavoriteBookCreate, db: Session = Depends(get_db)):
    existing = db.query(FavoriteBook).filter_by(open_library_key=body.open_library_key).first()
    if existing:
        return existing

    favorite = FavoriteBook(**body.model_dump())
    db.add(favorite)
    db.commit()
    return favorite


@router.delete("/{favorite_id}", status_code=204)
def remove_favorite(favorite_id: int, db: Session = Depends(get_db)):
    favorite = db.query(FavoriteBook).filter_by(id=favorite_id).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    db.delete(favorite)
    db.commit()
