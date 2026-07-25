"""Resolve book detail for the detail page — ingested DB books or Open Library works."""

from __future__ import annotations

import re

import requests
from sqlalchemy.orm import Session

from app.models.book import Book

OL_WORK_URL = "https://openlibrary.org/works/{key}.json"
OL_AUTHOR_URL = "https://openlibrary.org/authors/{key}.json"
OL_SEARCH_URL = "https://openlibrary.org/search.json"
OL_COVER_URL = "https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"

_session = requests.Session()

_WORK_KEY_RE = re.compile(r"^(OL\d+W)$", re.IGNORECASE)


def _get_json(url: str, params: dict | None = None) -> dict | None:
    try:
        res = _session.get(url, params=params, timeout=10)
        res.raise_for_status()
        return res.json()
    except requests.RequestException:
        return None


def _normalize_description(raw) -> str | None:
    if raw is None:
        return None
    if isinstance(raw, dict):
        text = raw.get("value") or raw.get("text")
        return text.strip() if isinstance(text, str) and text.strip() else None
    if isinstance(raw, str):
        text = raw.strip()
        return text or None
    return None


def _author_name_from_key(author_key: str) -> str:
    key = author_key.rstrip("/").split("/")[-1]
    data = _get_json(OL_AUTHOR_URL.format(key=key))
    if not data:
        return "Unknown author"
    return data.get("name") or "Unknown author"


def _from_open_library_work(work_key: str) -> dict | None:
    if not work_key:
        return None

    cleaned = work_key.strip()
    cleaned = cleaned.replace("%2F", "/")
    cleaned = cleaned.replace("%2f", "/")
    cleaned = cleaned.lstrip("/")
    cleaned = cleaned.split("/")[-1]

    if not cleaned.upper().startswith("OL"):
        return None

    data = _get_json(OL_WORK_URL.format(key=cleaned))
    if not data:
        return None

    authors = []
    for entry in data.get("authors") or []:
        akey = (entry.get("author") or {}).get("key")
        if akey:
            authors.append(_author_name_from_key(akey))

    covers = data.get("covers") or []
    subjects = data.get("subjects") or []
    genre = subjects[0] if subjects else None

    return {
        "id": cleaned,
        "title": data.get("title") or "Untitled",
        "author": authors[0] if authors else "Unknown author",
        "genre": genre,
        "rating": None,
        "ratings": None,
        "cover_url": OL_COVER_URL.format(cover_id=covers[0]) if covers else None,
        "description": _normalize_description(data.get("description")),
        "source": "open_library",
        "open_library_key": f"/works/{cleaned}",
    }


def _enrich_from_open_library(title: str, author: str) -> dict:
    """Best-effort cover/description/genre via Open Library search."""
    data = _get_json(
        OL_SEARCH_URL,
        {
            "title": title,
            "author": author,
            "fields": "key,title,author_name,cover_i,subject,first_sentence,ratings_average,ratings_count",
            "limit": 1,
        },
    )
    if not data or not data.get("docs"):
        return {}
    doc = data["docs"][0]
    subjects = doc.get("subject") or []
    first_sentence = doc.get("first_sentence")
    if isinstance(first_sentence, list):
        first_sentence = first_sentence[0] if first_sentence else None

    return {
        "genre": subjects[0] if subjects else None,
        "cover_url": (
            OL_COVER_URL.format(cover_id=doc["cover_i"]) if doc.get("cover_i") else None
        ),
        "description": first_sentence,
        "rating": round(float(doc["ratings_average"]), 2) if doc.get("ratings_average") else None,
        "ratings": int(doc["ratings_count"]) if doc.get("ratings_count") else None,
        "open_library_key": doc.get("key"),
    }


def _description_from_raw_text(raw_text: str | None, max_chars: int = 600) -> str | None:
    if not raw_text:
        return None
    # Skip likely front-matter headings; take first substantial paragraph.
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", raw_text) if p.strip()]
    for p in paragraphs:
        words = p.split()
        if len(words) < 40:
            continue
        if re.match(r"^(chapter|part|contents|table of contents)\b", p, re.I):
            continue
        text = " ".join(words)
        if len(text) > max_chars:
            return text[: max_chars - 1].rstrip() + "…"
        return text
    # Fallback: first N chars of raw text
    compact = " ".join(raw_text.split())
    if not compact:
        return None
    return compact[: max_chars - 1].rstrip() + "…" if len(compact) > max_chars else compact


def get_book_details(db: Session, book_ref: str) -> dict | None:
    """Resolve detail for either a numeric ingested book id or an OL work key."""
    ref = book_ref.strip()

    if ref.isdigit():
        book = db.query(Book).filter(Book.id == int(ref)).first()
        if not book:
            return None
        enriched = _enrich_from_open_library(book.title, book.author)
        description = enriched.get("description") or _description_from_raw_text(book.raw_text)
        return {
            "id": str(book.id),
            "title": book.title,
            "author": book.author,
            "genre": enriched.get("genre"),
            "rating": enriched.get("rating"),
            "ratings": enriched.get("ratings"),
            "cover_url": enriched.get("cover_url"),
            "description": description,
            "source": "database",
            "open_library_key": enriched.get("open_library_key"),
            "chunk_count": book.chunk_count,
        }

    # Open Library work key (from home picks/trending)
    match = _WORK_KEY_RE.match(ref) or _WORK_KEY_RE.match(ref.split("/")[-1])
    if match:
        return _from_open_library_work(match.group(1))

    # Last resort: treat as OL work key anyway
    if "OL" in ref.upper():
        return _from_open_library_work(ref)

    return None
