"""Background jobs (run via FastAPI BackgroundTasks in a thread pool). They
can't reuse the request's DB session — it's closed by the time they execute —
so each opens its own SessionLocal. Stages commit independently so completed
work survives a later-stage failure."""

from datetime import datetime

from app.core.database import SessionLocal
from app.models.book import Book
from app.models.chapter_theme import ChapterTheme
from app.models.analysis_job import BookAnalysisJob
from app.services.chapter_service import split_into_chapters
from app.services.theme_service import classify_chapter_themes
from app.services.analysis_service import persist_chunk_analyses
from app.services.dna_service import build_book_dna


def _persist_chapter_themes(db, book_id: int, book: Book) -> None:
    chapters = split_into_chapters(book.raw_text)
    db.query(ChapterTheme).filter_by(book_id=book_id).delete()
    for chapter in chapters:
        themes = classify_chapter_themes(chapter["text"])
        db.add(ChapterTheme(
            book_id=book_id,
            chapter_index=chapter["chapter_index"],
            title=chapter["title"],
            themes=themes,
        ))


def _fail(db, job_id: int, exc: Exception) -> None:
    db.rollback()
    job = db.query(BookAnalysisJob).filter_by(id=job_id).first()
    if job:
        job.status = "failed"
        job.error = str(exc)[:1000]
        db.commit()


def run_dna_pipeline_job(job_id: int, book_id: int) -> None:
    """Full pipeline: chunk analysis -> chapter themes -> DNA build."""
    db = SessionLocal()
    try:
        job = db.query(BookAnalysisJob).filter_by(id=job_id).first()
        job.status = "running"
        db.commit()

        book = db.query(Book).filter_by(id=book_id).first()

        job.stage = "analysis"
        db.commit()
        persist_chunk_analyses(db, book_id)
        db.commit()

        job.stage = "themes"
        db.commit()
        _persist_chapter_themes(db, book_id, book)
        db.commit()

        job.stage = "dna"
        db.commit()
        build_book_dna(db, book_id)
        db.commit()

        job.status = "completed"
        job.completed_at = datetime.utcnow()
        db.commit()
    except Exception as e:
        _fail(db, job_id, e)
    finally:
        db.close()


def run_theme_analysis_job(job_id: int, book_id: int) -> None:
    """Theme-only re-run, backing the manual POST /themes/books/{id}/analyze."""
    db = SessionLocal()
    try:
        job = db.query(BookAnalysisJob).filter_by(id=job_id).first()
        job.status = "running"
        job.stage = "themes"
        db.commit()

        book = db.query(Book).filter_by(id=book_id).first()
        _persist_chapter_themes(db, book_id, book)

        job.status = "completed"
        job.completed_at = datetime.utcnow()
        db.commit()
    except Exception as e:
        _fail(db, job_id, e)
    finally:
        db.close()
