"""Book-to-book and personalized recommendations over the BookDNA fingerprints.

Two-stage design: pgvector ANN on the semantic centroid retrieves a candidate
pool cheaply in the database, then candidates are re-ranked in Python by a
weighted blend of all four DNA blocks (semantic, emotion, theme, style)."""

import numpy as np
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.book import Book
from app.models.book_dna import BookDNA

# Blend weights for the re-rank. Semantic content dominates; emotion and theme
# refine; style is a light tie-breaker.
W_SEMANTIC = 0.5
W_EMOTION = 0.2
W_THEME = 0.2
W_STYLE = 0.1

CANDIDATE_POOL = 50


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


def _emotion_vec(dna: BookDNA) -> np.ndarray:
    scores = dna.emotion_profile.get("mean_scores", {})
    labels = sorted(scores.keys())
    return np.array([scores[label] for label in labels], dtype=np.float32)


def _theme_vec(dna: BookDNA) -> np.ndarray:
    return np.array(dna.theme_profile.get("vector", []), dtype=np.float32)


def _style_vec(dna: BookDNA) -> np.ndarray:
    s = dna.style_profile
    # All roughly 0..1 already; keeps the style comparison scale-free.
    return np.array([
        s.get("avg_pacing", 0.0),
        s.get("avg_dialogue_density", 0.0),
    ], dtype=np.float32)


def _style_similarity(a: BookDNA, b: BookDNA) -> float:
    va, vb = _style_vec(a), _style_vec(b)
    return 1.0 - float(np.mean(np.abs(va - vb)))


def _blend(target: BookDNA, cand: BookDNA, semantic_sim: float) -> dict:
    emotion_sim = _cosine(_emotion_vec(target), _emotion_vec(cand))
    theme_sim = _cosine(_theme_vec(target), _theme_vec(cand))
    style_sim = _style_similarity(target, cand)
    score = (
        W_SEMANTIC * semantic_sim
        + W_EMOTION * emotion_sim
        + W_THEME * theme_sim
        + W_STYLE * style_sim
    )
    return {
        "score": round(score, 4),
        "semantic": round(semantic_sim, 4),
        "emotion": round(emotion_sim, 4),
        "theme": round(theme_sim, 4),
        "style": round(style_sim, 4),
    }


def _ann_candidates(db: Session, centroid: list[float], exclude_ids: list[int], pool: int) -> dict[int, float]:
    """pgvector cosine ANN over book_dna, returning {book_id: semantic_sim}."""
    exclude = exclude_ids or [-1]
    sql = text("""
        SELECT book_id, 1 - (semantic_centroid <=> CAST(:vec AS vector)) AS sim
        FROM book_dna
        WHERE semantic_centroid IS NOT NULL
          AND book_id != ALL(:exclude)
        ORDER BY semantic_centroid <=> CAST(:vec AS vector)
        LIMIT :pool
    """)
    rows = db.execute(sql, {"vec": str(centroid), "exclude": exclude, "pool": pool}).fetchall()
    return {row.book_id: float(row.sim) for row in rows}


def _assemble(db: Session, target: BookDNA, candidate_sims: dict[int, float], limit: int) -> list[dict]:
    if not candidate_sims:
        return []

    cand_dnas = db.query(BookDNA).filter(BookDNA.book_id.in_(list(candidate_sims.keys()))).all()
    books = {
        b.id: b
        for b in db.query(Book).filter(Book.id.in_(list(candidate_sims.keys()))).all()
    }

    scored = []
    for cand in cand_dnas:
        book = books.get(cand.book_id)
        if not book:
            continue
        breakdown = _blend(target, cand, candidate_sims.get(cand.book_id, 0.0))
        scored.append({
            "book_id": cand.book_id,
            "title": book.title,
            "author": book.author,
            **breakdown,
        })

    scored.sort(key=lambda r: -r["score"])
    return scored[:limit]


def similar_books(db: Session, book_id: int, limit: int = 10) -> list[dict]:
    target = db.query(BookDNA).filter_by(book_id=book_id).first()
    if target is None or target.semantic_centroid is None:
        return []

    centroid = list(target.semantic_centroid)
    candidate_sims = _ann_candidates(db, centroid, exclude_ids=[book_id], pool=CANDIDATE_POOL)
    return _assemble(db, target, candidate_sims, limit)


def recommend_for_user(
    db: Session,
    liked_book_ids: list[int],
    disliked_book_ids: list[int] | None = None,
    limit: int = 10,
) -> list[dict]:
    """Build a taste centroid from liked books (pushed away from disliked),
    retrieve nearest books, and re-rank against the average liked profile."""
    disliked_book_ids = disliked_book_ids or []

    liked = db.query(BookDNA).filter(
        BookDNA.book_id.in_(liked_book_ids), BookDNA.semantic_centroid.isnot(None)
    ).all()
    if not liked:
        return []
    disliked = db.query(BookDNA).filter(
        BookDNA.book_id.in_(disliked_book_ids), BookDNA.semantic_centroid.isnot(None)
    ).all()

    liked_centroids = np.array([list(d.semantic_centroid) for d in liked], dtype=np.float32)
    taste = liked_centroids.mean(axis=0)
    if disliked:
        disliked_centroids = np.array([list(d.semantic_centroid) for d in disliked], dtype=np.float32)
        taste = taste - 0.5 * disliked_centroids.mean(axis=0)
    norm = np.linalg.norm(taste)
    if norm > 0:
        taste = taste / norm

    exclude = list(set(liked_book_ids) | set(disliked_book_ids))
    candidate_sims = _ann_candidates(db, taste.tolist(), exclude_ids=exclude, pool=CANDIDATE_POOL)
    if not candidate_sims:
        return []

    # Re-rank against a synthetic "taste profile" built from the liked books'
    # averaged emotion and theme vectors (semantic sim already from the ANN).
    liked_emotion = np.mean([_emotion_vec(d) for d in liked], axis=0)
    liked_theme = np.mean([_theme_vec(d) for d in liked], axis=0)

    cand_dnas = db.query(BookDNA).filter(BookDNA.book_id.in_(list(candidate_sims.keys()))).all()
    books = {
        b.id: b
        for b in db.query(Book).filter(Book.id.in_(list(candidate_sims.keys()))).all()
    }

    scored = []
    for cand in cand_dnas:
        book = books.get(cand.book_id)
        if not book:
            continue
        semantic_sim = candidate_sims.get(cand.book_id, 0.0)
        emotion_sim = _cosine(liked_emotion, _emotion_vec(cand))
        theme_sim = _cosine(liked_theme, _theme_vec(cand))
        score = W_SEMANTIC * semantic_sim + W_EMOTION * emotion_sim + W_THEME * theme_sim
        # Renormalize since style is omitted here.
        score = score / (W_SEMANTIC + W_EMOTION + W_THEME)
        scored.append({
            "book_id": cand.book_id,
            "title": book.title,
            "author": book.author,
            "score": round(score, 4),
            "semantic": round(semantic_sim, 4),
            "emotion": round(emotion_sim, 4),
            "theme": round(theme_sim, 4),
            "style": None,
        })

    scored.sort(key=lambda r: -r["score"])
    return scored[:limit]
