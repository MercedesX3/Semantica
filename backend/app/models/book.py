from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    author = Column(String(300), nullable=False)
    raw_text = Column(Text)
    chunk_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    chunks = relationship("BookChunk", back_populates="book", cascade="all, delete-orphan")


class BookChunk(Base):
    __tablename__ = "book_chunks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)  # global, sequential across the whole book
    # Aligns with ChapterTheme.chapter_index (both derive from split_into_chapters).
    chapter_index = Column(Integer, index=True)
    chapter_title = Column(String(200))
    text = Column(Text, nullable=False)
    word_count = Column(Integer)
    embedding = Column(Vector(384))
    created_at = Column(DateTime, default=datetime.utcnow)

    book = relationship("Book", back_populates="chunks")
