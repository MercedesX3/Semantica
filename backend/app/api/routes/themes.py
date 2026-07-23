from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.book import Book
from app.models.chapter_theme import ChapterTheme
from app.models.analysis_job import BookAnalysisJob
from app.schemas.theme import (
    ThemeJobResponse,
    ThemeJobStatusResponse,
    BookThemeProfileResponse,
    ChapterThemeResult,
)
from app.services.analysis_job_service import run_theme_analysis_job
from app.services.theme_service import aggregate_book_themes

router = APIRouter()


@router.post("/books/{book_id}/analyze", response_model=ThemeJobResponse, status_code=202)
def start_theme_analysis(book_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    job = BookAnalysisJob(book_id=book_id, status="pending")
    db.add(job)
    db.commit()

    # Runs in a thread pool (Starlette's default for sync background tasks),
    # so this returns immediately rather than blocking on the multi-minute
    # zero-shot classification run.
    background_tasks.add_task(run_theme_analysis_job, job.id, book_id)

    return ThemeJobResponse(job_id=job.id, book_id=book_id, status=job.status)


@router.get("/jobs/{job_id}", response_model=ThemeJobStatusResponse)
def get_theme_job_status(job_id: int, db: Session = Depends(get_db)):
    job = db.query(BookAnalysisJob).filter(BookAnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return ThemeJobStatusResponse(
        job_id=job.id,
        book_id=job.book_id,
        status=job.status,
        stage=job.stage,
        error=job.error,
        created_at=job.created_at,
        completed_at=job.completed_at,
    )


@router.get("/books/{book_id}", response_model=BookThemeProfileResponse)
def get_book_theme_profile(book_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(ChapterTheme)
        .filter(ChapterTheme.book_id == book_id)
        .order_by(ChapterTheme.chapter_index)
        .all()
    )
    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No theme analysis found. Run POST /themes/books/{book_id}/analyze first.",
        )

    book_themes = aggregate_book_themes([row.themes for row in rows])

    return BookThemeProfileResponse(
        book_id=book_id,
        chapter_count=len(rows),
        themes=book_themes,
        chapters=[ChapterThemeResult.model_validate(row) for row in rows],
    )
