"""Aggregates a book's per-chunk and per-chapter signals into one unified,
comparable BookDNA row. Depends on book_chunks (embeddings), chunk_analyses
(emotion/style), and chapter_themes (literary themes) already being present."""

import numpy as np
from sqlalchemy.orm import Session

from app.models.book import BookChunk
from app.models.chunk_analysis import ChunkAnalysis
from app.models.chapter_theme import ChapterTheme
from app.models.book_dna import BookDNA
from app.services.analysis_service import extract_themes, SENTIMENT_MAP
from app.services.theme_service import aggregate_book_themes, THEME_TAXONOMY

# Stable ordering for the 28-d emotion vector (GoEmotions labels).
EMOTION_LABELS = sorted(SENTIMENT_MAP.keys())

# Numeric sentiment used to plot the arc series.
_SENTIMENT_VALUE = {"positive": 1.0, "neutral": 0.0, "negative": -1.0}

ARC_POINTS = 9


def _downsample(values: list[float], n: int = ARC_POINTS) -> list[float]:
    """Evenly resample a per-chunk series down to n points for charting."""
    if not values:
        return []
    if len(values) <= n:
        return [round(float(v), 4) for v in values]
    idx = np.linspace(0, len(values) - 1, n).round().astype(int)
    return [round(float(values[i]), 4) for i in idx]


def _semantic_centroid(chunks: list[BookChunk]) -> list[float] | None:
    vectors = [c.embedding for c in chunks if c.embedding is not None]
    if not vectors:
        return None
    centroid = np.asarray(vectors, dtype=np.float32).mean(axis=0)
    norm = np.linalg.norm(centroid)
    if norm > 0:
        centroid = centroid / norm
    return centroid.tolist()


def _emotion_profile(analyses: list[ChunkAnalysis]) -> dict:
    mean_scores = {
        label: round(
            float(np.mean([a.emotion_scores.get(label, 0.0) for a in analyses])), 4
        )
        for label in EMOTION_LABELS
    }

    # Reuse the existing arc extractor (expects dicts with an "emotion" key).
    arc_input = [{"emotion": a.emotion, "intensity": a.intensity, "themes": a.themes} for a in analyses]
    arc = extract_themes(arc_input)

    intensities = [a.intensity for a in analyses]
    volatility = round(float(np.std(intensities)), 4) if intensities else 0.0
    peak = max(analyses, key=lambda a: a.intensity).emotion if analyses else "neutral"

    return {
        "mean_scores": mean_scores,
        "beginning_emotion": arc["beginning_emotion"],
        "middle_emotion": arc["middle_emotion"],
        "end_emotion": arc["end_emotion"],
        "arc_label": arc["theme_arc"],
        "volatility": volatility,
        "peak_emotion": peak,
    }


def _theme_profile(chapter_rows: list[ChapterTheme]) -> dict:
    chapter_theme_lists = [row.themes for row in chapter_rows]

    # Full ranking so we can project onto a fixed-length vector.
    all_scored = aggregate_book_themes(chapter_theme_lists, top_n=len(THEME_TAXONOMY))
    score_by_theme = {entry["theme"]: entry["confidence"] for entry in all_scored}
    vector = [round(score_by_theme.get(theme, 0.0), 4) for theme in THEME_TAXONOMY]

    return {
        "vector": vector,
        "top": aggregate_book_themes(chapter_theme_lists, top_n=8),
    }


def _style_profile(chunks: list[BookChunk], analyses: list[ChunkAnalysis]) -> dict:
    pacings = [a.pacing for a in analyses]
    dialogue = [a.dialogue_density for a in analyses]
    word_counts = [c.word_count for c in chunks if c.word_count is not None]
    characters = {name for a in analyses for name in (a.characters or [])}

    return {
        "avg_pacing": round(float(np.mean(pacings)), 4) if pacings else 0.0,
        "pacing_variance": round(float(np.var(pacings)), 4) if pacings else 0.0,
        "avg_dialogue_density": round(float(np.mean(dialogue)), 4) if dialogue else 0.0,
        "character_count": len(characters),
        "chunk_count": len(chunks),
        "avg_word_count": round(float(np.mean(word_counts)), 1) if word_counts else 0.0,
    }


def _arc_series(analyses: list[ChunkAnalysis]) -> dict:
    sentiment = [_SENTIMENT_VALUE.get(a.sentiment, 0.0) for a in analyses]
    intensity = [a.intensity for a in analyses]
    pacing = [a.pacing for a in analyses]
    return {
        "sentiment_series": _downsample(sentiment),
        "intensity_series": _downsample(intensity),
        "pacing_series": _downsample(pacing),
    }


def build_book_dna(db: Session, book_id: int) -> BookDNA:
    """Fold a book's committed signals into a single BookDNA row (upsert).
    Flushes but does not commit — the caller owns the transaction."""
    chunks = (
        db.query(BookChunk)
        .filter(BookChunk.book_id == book_id)
        .order_by(BookChunk.chunk_index)
        .all()
    )
    if not chunks:
        raise ValueError(f"Book {book_id} has no chunks")

    analyses = [
        a for a, _ in (
            db.query(ChunkAnalysis, BookChunk)
            .join(BookChunk, ChunkAnalysis.chunk_id == BookChunk.id)
            .filter(BookChunk.book_id == book_id)
            .order_by(BookChunk.chunk_index)
            .all()
        )
    ]
    if not analyses:
        raise ValueError(f"Book {book_id} has no chunk analyses — run analysis first")

    chapter_rows = (
        db.query(ChapterTheme)
        .filter(ChapterTheme.book_id == book_id)
        .order_by(ChapterTheme.chapter_index)
        .all()
    )

    fields = dict(
        semantic_centroid=_semantic_centroid(chunks),
        emotion_profile=_emotion_profile(analyses),
        theme_profile=_theme_profile(chapter_rows),
        style_profile=_style_profile(chunks, analyses),
        arc=_arc_series(analyses),
    )

    dna = db.query(BookDNA).filter_by(book_id=book_id).first()
    if dna:
        for key, val in fields.items():
            setattr(dna, key, val)
    else:
        dna = BookDNA(book_id=book_id, **fields)
        db.add(dna)

    db.flush()
    return dna
