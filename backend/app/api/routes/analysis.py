from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.book import Book, BookChunk
from app.models.chunk_analysis import ChunkAnalysis
from app.services.analysis_service import analyze_chunk, extract_themes
from app.schemas.analysis import BookAnalysisResponse, ChunkAnalysisResult, ThemeArcResponse

router = APIRouter()


@router.post("/books/{book_id}", response_model=BookAnalysisResponse)
def run_analysis(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    chunks = (
        db.query(BookChunk)
        .filter(BookChunk.book_id == book_id)
        .order_by(BookChunk.chunk_index)
        .all()
    )
    if not chunks:
        raise HTTPException(status_code=400, detail="Book has no chunks — ingest it first")

    results = []
    for chunk in chunks:
        data = analyze_chunk(chunk.text)

        existing = db.query(ChunkAnalysis).filter_by(chunk_id=chunk.id).first()
        if existing:
            for key, val in data.items():
                setattr(existing, key, val)
        else:
            db.add(ChunkAnalysis(chunk_id=chunk.id, **data))

        results.append(ChunkAnalysisResult(
            chunk_id=chunk.id,
            chunk_index=chunk.chunk_index,
            **data,
        ))

    db.commit()
    return BookAnalysisResponse(book_id=book_id, chunk_count=len(results), results=results)


@router.get("/books/{book_id}", response_model=BookAnalysisResponse)
def get_analysis(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    rows = (
        db.query(ChunkAnalysis, BookChunk)
        .join(BookChunk, ChunkAnalysis.chunk_id == BookChunk.id)
        .filter(BookChunk.book_id == book_id)
        .order_by(BookChunk.chunk_index)
        .all()
    )
    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No analysis found. Run POST /analysis/books/{book_id} first.",
        )

    results = [
        ChunkAnalysisResult(
            chunk_id=analysis.chunk_id,
            chunk_index=chunk.chunk_index,
            emotion=analysis.emotion,
            emotion_scores=analysis.emotion_scores,
            sentiment=analysis.sentiment,
            intensity=analysis.intensity,
            pacing=analysis.pacing,
            dialogue_density=analysis.dialogue_density,
            characters=analysis.characters,
        )
        for analysis, chunk in rows
    ]
    return BookAnalysisResponse(book_id=book_id, chunk_count=len(results), results=results)


@router.get("/books/{book_id}/themes", response_model=ThemeArcResponse)
def get_themes(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    rows = (
        db.query(ChunkAnalysis, BookChunk)
        .join(BookChunk, ChunkAnalysis.chunk_id == BookChunk.id)
        .filter(BookChunk.book_id == book_id)
        .order_by(BookChunk.chunk_index)
        .all()
    )
    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No analysis found. Run POST /analysis/books/{book_id} first.",
        )

    analyses = [
        {"emotion": a.emotion, "intensity": a.intensity}
        for a, _ in rows
    ]
    theme_data = extract_themes(analyses)
    return ThemeArcResponse(book_id=book_id, **theme_data)
