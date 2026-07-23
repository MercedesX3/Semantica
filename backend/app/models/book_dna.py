from datetime import datetime
from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base


class BookDNA(Base):
    """One unified, comparable fingerprint per book, aggregated from the
    per-chunk signals (embeddings, emotion, style) and per-chapter themes.

    The semantic centroid lives in a pgvector column so book->book nearest
    neighbour retrieval can run in the database; the other three blocks stay
    interpretable JSONB so the UI can render the "genome" panels directly."""

    __tablename__ = "book_dna"
    __table_args__ = (UniqueConstraint("book_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)

    # Mean of chunk embeddings, L2-normalized. Backbone for similarity search.
    semantic_centroid = Column(Vector(384))

    # { mean_scores: {28 labels}, beginning_emotion, middle_emotion,
    #   end_emotion, arc_label, volatility, peak_emotion }
    emotion_profile = Column(JSONB, nullable=False)

    # { vector: [27 floats aligned to THEME_TAXONOMY], top: [{theme, ...}] }
    theme_profile = Column(JSONB, nullable=False)

    # { avg_pacing, pacing_variance, avg_dialogue_density, character_count,
    #   chunk_count, avg_word_count }
    style_profile = Column(JSONB, nullable=False)

    # Downsampled per-position series for the sentiment-arc chart.
    # { sentiment_series: [...], intensity_series: [...], pacing_series: [...] }
    arc = Column(JSONB, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    book = relationship("Book")
