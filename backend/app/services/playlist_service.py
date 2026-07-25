"""Build chapter-sequenced playlists from book DNA + Spotify Search.

For each chapter: aggregate chunk emotion/pacing -> mood query -> Spotify
tracks (or deterministic stubs when credentials are missing)."""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy.orm import Session

from app.models.book import Book, BookChunk
from app.models.chunk_analysis import ChunkAnalysis
from app.models.chapter_theme import ChapterTheme
from app.services.mood_mapping_service import (
    average_pacing,
    dominant_emotion,
    dominant_sentiment,
    map_chapter_mood,
)
from app.services.spotify_service import search_tracks, spotify_configured

TRACKS_PER_CHAPTER = 3

# Deterministic stubs so the UI works without Spotify credentials.
_FALLBACK_POOL = [
    ("Salt and Cream", "Low Orbit Ensemble", "melancholic"),
    ("Paper Moons", "Quiet Speculative", "calm"),
    ("District Lines", "Hunger Strings", "tense"),
    ("Found Family Theme", "Cerulean Choir", "warm"),
    ("Myth Retold", "Aegean Pulse", "epic"),
    ("Slow Burn Waltz", "Pink Margin", "romantic"),
    ("After the Storm", "Arc Light", "hopeful"),
    ("Corridor Run", "Chapter Nine", "energetic"),
]


def _fallback_tracks(mood: dict, chapter_index: int, n: int = TRACKS_PER_CHAPTER) -> list[dict]:
    start = (chapter_index * n) % len(_FALLBACK_POOL)
    tracks = []
    for i in range(n):
        name, artist, _ = _FALLBACK_POOL[(start + i) % len(_FALLBACK_POOL)]
        tracks.append({
            "id": f"fallback-{chapter_index}-{i}",
            "name": f"{name} ({mood['energy']})",
            "artist": artist,
            "album": mood["mood_label"],
            "duration_ms": 180_000 + (i * 15_000),
            "preview_url": None,
            "external_url": None,
            "image_url": None,
        })
    return tracks


def _format_duration(ms: int) -> str:
    total_sec = max(ms // 1000, 0)
    h, rem = divmod(total_sec, 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h}HR {m:02d}MIN"
    return f"{m}MIN {s:02d}S"


def _accent_for_sentiment(sentiment: str) -> str:
    return {
        "positive": "bg-pink-500",
        "negative": "bg-blue-700",
        "neutral": "bg-violet-600",
    }.get(sentiment, "bg-violet-600")


def _chapter_analyses(
    db: Session, book_id: int
) -> tuple[dict[int, list[dict]], dict[int, str | None]]:
    rows = (
        db.query(BookChunk, ChunkAnalysis)
        .join(ChunkAnalysis, ChunkAnalysis.chunk_id == BookChunk.id)
        .filter(BookChunk.book_id == book_id)
        .order_by(BookChunk.chunk_index)
        .all()
    )
    by_chapter: dict[int, list[dict]] = defaultdict(list)
    titles: dict[int, str | None] = {}
    for chunk, analysis in rows:
        idx = chunk.chapter_index if chunk.chapter_index is not None else 0
        titles[idx] = chunk.chapter_title
        by_chapter[idx].append({
            "emotion": analysis.emotion,
            "sentiment": analysis.sentiment,
            "pacing": analysis.pacing,
            "intensity": analysis.intensity,
        })
    return by_chapter, titles


def _chapter_top_theme(db: Session, book_id: int, chapter_index: int) -> str | None:
    row = (
        db.query(ChapterTheme)
        .filter_by(book_id=book_id, chapter_index=chapter_index)
        .first()
    )
    if not row or not row.themes:
        return None
    return row.themes[0].get("theme")


def build_book_playlist(db: Session, book_id: int, tracks_per_chapter: int = TRACKS_PER_CHAPTER) -> dict:
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise ValueError("Book not found")

    by_chapter, titles = _chapter_analyses(db, book_id)
    if not by_chapter:
        raise ValueError("No chunk analysis found — run DNA analysis first")

    used_track_ids: set[str] = set()
    chapters_out = []
    all_tracks: list[dict] = []

    for chapter_index in sorted(by_chapter.keys()):
        analyses = by_chapter[chapter_index]
        emotion = dominant_emotion(analyses)
        sentiment = dominant_sentiment(analyses)
        pacing = average_pacing(analyses)
        theme = _chapter_top_theme(db, book_id, chapter_index)
        mood = map_chapter_mood(emotion, sentiment, pacing, theme)

        if spotify_configured():
            try:
                raw = search_tracks(mood["query"], limit=tracks_per_chapter + 4)
                tracks = []
                for t in raw:
                    tid = t.get("id") or t["name"]
                    if tid in used_track_ids:
                        continue
                    used_track_ids.add(tid)
                    tracks.append(t)
                    if len(tracks) >= tracks_per_chapter:
                        break
                if not tracks:
                    tracks = _fallback_tracks(mood, chapter_index, tracks_per_chapter)
            except Exception:
                tracks = _fallback_tracks(mood, chapter_index, tracks_per_chapter)
        else:
            tracks = _fallback_tracks(mood, chapter_index, tracks_per_chapter)

        all_tracks.extend(tracks)
        chapters_out.append({
            "chapter_index": chapter_index,
            "title": titles.get(chapter_index) or f"Chapter {chapter_index + 1}",
            "mood": mood,
            "tracks": tracks,
        })

    total_ms = sum(t.get("duration_ms") or 0 for t in all_tracks)
    overall_sentiment = dominant_sentiment(
        [a for analyses in by_chapter.values() for a in analyses]
    )

    return {
        "book_id": book.id,
        "book_title": book.title,
        "author": book.author,
        "playlist_title": f"Reading {book.title}",
        "track_count": len(all_tracks),
        "duration": _format_duration(total_ms),
        "accent_color": _accent_for_sentiment(overall_sentiment),
        "spotify_enabled": spotify_configured(),
        "chapters": chapters_out,
        "tracks": all_tracks,  # flat arc-ordered list for the player bar
    }


def list_playlist_summaries(db: Session) -> list[dict]:
    """One summary card per analyzed book (has chunk_analyses)."""
    book_ids = [
        row[0]
        for row in (
            db.query(BookChunk.book_id)
            .join(ChunkAnalysis, ChunkAnalysis.chunk_id == BookChunk.id)
            .distinct()
            .all()
        )
    ]
    summaries = []
    for book_id in book_ids:
        try:
            full = build_book_playlist(db, book_id, tracks_per_chapter=2)
        except ValueError:
            continue
        summaries.append({
            "book_id": full["book_id"],
            "book_title": full["book_title"],
            "author": full["author"],
            "playlist_title": full["playlist_title"],
            "track_count": full["track_count"],
            "duration": full["duration"],
            "accent_color": full["accent_color"],
            "chapter_count": len(full["chapters"]),
            "spotify_enabled": full["spotify_enabled"],
            "cover_url": None,
        })
    return summaries
