from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class ChunkAnalysis(Base):
    __tablename__ = "chunk_analyses"
    __table_args__ = (UniqueConstraint("chunk_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    chunk_id = Column(Integer, ForeignKey("book_chunks.id", ondelete="CASCADE"), nullable=False, index=True)
    emotion = Column(String(50), nullable=False)
    emotion_scores = Column(JSONB, nullable=False)
    sentiment = Column(String(10), nullable=False)
    intensity = Column(Float, nullable=False)
    pacing = Column(Float, nullable=False)
    dialogue_density = Column(Float, nullable=False)
    characters = Column(JSONB, nullable=False)
    themes = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    chunk = relationship("BookChunk", backref="analysis")
