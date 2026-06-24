from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
import numpy as np
from sklearn.decomposition import PCA

from app.core.database import get_db
from app.models.book import Book, BookChunk
from app.models.chunk_analysis import ChunkAnalysis
from app.services.analysis_service import SENTIMENT_MAP

router = APIRouter()

EMOTION_LABELS = list(SENTIMENT_MAP.keys())


class ChunkPoint(BaseModel):
    chunk_index: int
    x: float
    y: float
    text_preview: str
    word_count: int | None


class VisualizationResponse(BaseModel):
    book_id: int
    title: str
    author: str
    points: list[ChunkPoint]
    variance_explained: list[float]
    axis_labels: list[str] | None = None


@router.get("/books/{book_id}", response_model=VisualizationResponse)
def get_book_visualization(
    book_id: int,
    mode: Literal["topic", "emotion"] = Query(default="topic"),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if mode == "emotion":
        rows = (
            db.query(BookChunk, ChunkAnalysis)
            .join(ChunkAnalysis, ChunkAnalysis.chunk_id == BookChunk.id)
            .filter(BookChunk.book_id == book_id)
            .order_by(BookChunk.chunk_index)
            .all()
        )
        if len(rows) < 2:
            raise HTTPException(
                status_code=400,
                detail="Book needs at least 2 analyzed chunks for the emotion graph — run POST /analysis/books/{book_id} first.",
            )
        chunks = [chunk for chunk, _ in rows]
        vectors = np.array([
            [analysis.emotion_scores.get(label, 0.0) for label in EMOTION_LABELS]
            for _, analysis in rows
        ])
    else:
        chunks = (
            db.query(BookChunk)
            .filter(BookChunk.book_id == book_id)
            .order_by(BookChunk.chunk_index)
            .all()
        )
        if len(chunks) < 2:
            raise HTTPException(status_code=400, detail="Book needs at least 2 chunks to visualize")
        vectors = np.array([chunk.embedding for chunk in chunks])

    pca = PCA(n_components=2)
    coords = pca.fit_transform(vectors)
    variance = pca.explained_variance_ratio_.tolist()

    axis_labels = None
    if mode == "emotion":
        axis_labels = [
            f"{EMOTION_LABELS[int(np.argmax(component))]} vs {EMOTION_LABELS[int(np.argmin(component))]}"
            for component in pca.components_
        ]

    points = [
        ChunkPoint(
            chunk_index=chunk.chunk_index,
            x=round(float(coords[i, 0]), 4),
            y=round(float(coords[i, 1]), 4),
            text_preview=chunk.text[:120] + "..." if len(chunk.text) > 120 else chunk.text,
            word_count=chunk.word_count,
        )
        for i, chunk in enumerate(chunks)
    ]

    return VisualizationResponse(
        book_id=book.id,
        title=book.title,
        author=book.author,
        points=points,
        variance_explained=[round(v, 4) for v in variance],
        axis_labels=axis_labels,
    )
