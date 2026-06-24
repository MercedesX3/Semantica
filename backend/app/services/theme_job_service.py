from datetime import datetime

from app.core.database import SessionLocal
from app.models.book import Book
from app.models.chapter_theme import ChapterTheme
from app.models.theme_job import BookThemeJob
from app.services.chapter_service import split_into_chapters
from app.services.theme_service import classify_chapter_themes


def run_theme_analysis_job(job_id: int, book_id: int) -> None:
    """Runs in a background thread (via FastAPI's BackgroundTasks), so it
    can't reuse the request's DB session — that's closed by the time this
    actually executes. Opens its own session instead."""
    db = SessionLocal()
    try:
        job = db.query(BookThemeJob).filter_by(id=job_id).first()
        job.status = "running"
        db.commit()

        book = db.query(Book).filter_by(id=book_id).first()
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

        job.status = "completed"
        job.completed_at = datetime.utcnow()
        db.commit()
    except Exception as e:
        db.rollback()
        job = db.query(BookThemeJob).filter_by(id=job_id).first()
        job.status = "failed"
        job.error = str(e)[:1000]
        db.commit()
    finally:
        db.close()
