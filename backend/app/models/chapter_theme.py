from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class ChapterTheme(Base):
    __tablename__ = "chapter_themes"
    __table_args__ = (UniqueConstraint("book_id", "chapter_index"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_index = Column(Integer, nullable=False)
    title = Column(String(200))
    themes = Column(JSONB, nullable=False)  # [{"theme": ..., "confidence": ...}, ...]
    created_at = Column(DateTime, default=datetime.utcnow)

    book = relationship("Book")
