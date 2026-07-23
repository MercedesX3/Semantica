from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class BookAnalysisJob(Base):
    """Tracks the async DNA pipeline for a book: chunk analysis -> chapter
    themes -> DNA build. Also still backs the standalone theme re-run
    endpoint, which drives only the theme stage."""

    __tablename__ = "book_analysis_jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending")  # pending | running | completed | failed
    stage = Column(String(20))  # analysis | themes | dna — last stage entered
    error = Column(String(1000))
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    book = relationship("Book")
