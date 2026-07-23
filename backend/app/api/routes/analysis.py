from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.book import Book, BookChunk
from app.models.chunk_analysis import ChunkAnalysis
from app.models.book_dna import BookDNA
from app.services.analysis_service import persist_chunk_analyses, extract_themes, aggregate_themes
from app.schemas.analysis import BookAnalysisResponse, ChunkAnalysisResult, ThemeArcResponse, BookDNAResponse

router = APIRouter()


@router.post("/books/{book_id}", response_model=BookAnalysisResponse)
def run_analysis(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    results_data = persist_chunk_analyses(db, book_id)
    if not results_data:
        raise HTTPException(status_code=400, detail="Book has no chunks — ingest it first")

    db.commit()
    results = [ChunkAnalysisResult(**data) for data in results_data]
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
            themes=analysis.themes,
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
        {"emotion": a.emotion, "intensity": a.intensity, "themes": a.themes}
        for a, _ in rows
    ]
    theme_data = extract_themes(analyses)
    top_themes = aggregate_themes(analyses)
    return ThemeArcResponse(book_id=book_id, themes=top_themes, **theme_data)


@router.get("/books/{book_id}/dna", response_model=BookDNAResponse)
def get_book_dna(book_id: int, db: Session = Depends(get_db)):
    dna = db.query(BookDNA).filter_by(book_id=book_id).first()
    if dna is None:
        raise HTTPException(
            status_code=404,
            detail="No DNA found. It is built automatically after ingest; poll GET /themes/jobs/{id}.",
        )
    return BookDNAResponse(
        book_id=book_id,
        emotion_profile=dna.emotion_profile,
        theme_profile=dna.theme_profile,
        style_profile=dna.style_profile,
        arc=dna.arc,
    )
