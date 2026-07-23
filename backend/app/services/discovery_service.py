"""Open-Library-backed "recommended for you" discovery.

The DNA recommender needs ingested+analyzed books; for the home rail we want
real titles WITH cover art seeded from the user's favorites, without requiring
a local corpus. This discovers the favorites' subjects, then pulls popular
books in those subjects (which come with cover ids) from Open Library."""

from collections import Counter

import requests

OL_SEARCH_URL = "https://openlibrary.org/search.json"
OL_SUBJECT_URL = "https://openlibrary.org/subjects/{slug}.json"
COVER_URL = "https://covers.openlibrary.org/b/id/{cover_id}-M.jpg"

# Reuse one connection (keep-alive) across the several calls a request makes.
_session = requests.Session()

# Used when the user has no favorites yet.
ASSUMED_FAVORITE_TITLES = [
    "Atmosphere",
    "Circe",
    "The Song of Achilles",
    "The House in the Cerulean Sea",
]

FALLBACK_SUBJECTS = ["fantasy", "mythology", "romance"]

# Open Library tags each work with dozens of noisy subjects (catalog codes,
# "nyt:..." lists, plot nouns). We only let through genre-ish subjects, in
# rough priority order — the earlier ones make sharper "more like this" seeds
# than broad ones like "magic" (which skews to public-domain classics).
_MEANINGFUL_SUBJECTS = [
    "mythology", "greek mythology", "retellings", "historical fiction",
    "fantasy fiction", "fantasy", "romance", "love stories",
    "coming of age", "adventure", "fairy tales", "adventure stories",
    "young adult fiction", "science fiction", "paranormal fiction",
    "magic", "horror", "dystopia",
]
_SUBJECT_PRIORITY = {subject: i for i, subject in enumerate(_MEANINGFUL_SUBJECTS)}

# Only these Open Library subjects map to app genre tags; others render untagged.
_GENRE_BY_SUBJECT = {
    "fantasy": "Fantasy",
    "fantasy fiction": "Fantasy",
    "science fiction": "Science Fiction",
    "dystopia": "Dystopian",
    "romance": "Romance",
    "love stories": "Romance",
    "horror": "Horror",
    "fiction": "Fiction",
    "mythology": "Fantasy",
    "greek mythology": "Fantasy",
    "classic literature": "Classic",
    "literature": "Literary",
}

def _clean_subject(subject: str) -> str:
    return subject.strip().strip(".").strip().lower()


def _get_json(url: str, params: dict | None = None) -> dict | None:
    try:
        res = _session.get(url, params=params, timeout=8)
        res.raise_for_status()
        return res.json()
    except requests.RequestException:
        return None


def _subjects_for_title(title: str) -> list[str]:
    data = _get_json(OL_SEARCH_URL, {"q": title, "fields": "title,subject", "limit": 1})
    if not data or not data.get("docs"):
        return []
    return [_clean_subject(s) for s in (data["docs"][0].get("subject") or [])]


def _discover_subjects(seed_titles: list[str]) -> list[str]:
    # Only keep genre-ish subjects; catalog noise ("nyt:...", science terms
    # from the wrong "Atmosphere" match, etc.) is dropped entirely. Order by
    # how many favorites share the subject, then by our relevance priority.
    counter: Counter = Counter()
    for title in seed_titles:
        for subject in set(_subjects_for_title(title)):
            if subject in _SUBJECT_PRIORITY:
                counter[subject] += 1
    if not counter:
        return FALLBACK_SUBJECTS
    return sorted(counter, key=lambda s: (-counter[s], _SUBJECT_PRIORITY[s]))


def _books_in_subject(subject: str, limit: int = 12) -> list[dict]:
    # Search (not the /subjects endpoint) with a popularity sort surfaces
    # contemporary, widely-read titles instead of public-domain classics.
    slug = subject.strip().lower().replace(" ", "_")
    data = _get_json(OL_SEARCH_URL, {
        "subject": slug,
        "language": "eng",
        "sort": "want_to_read",
        "fields": "key,title,author_name,cover_i",
        "limit": limit,
    })
    if not data:
        return []

    books = []
    for doc in data.get("docs", []):
        cover_i = doc.get("cover_i")
        if not cover_i:
            continue  # a cover is the whole point of this feature
        books.append({
            "key": doc.get("key"),
            "title": doc.get("title", "Untitled"),
            "author": (doc.get("author_name") or ["Unknown author"])[0],
            "cover_url": COVER_URL.format(cover_id=cover_i),
            "genre": _GENRE_BY_SUBJECT.get(subject),
            "subject": subject,
        })
    return books


def for_you_recommendations(seed_titles: list[str] | None, limit: int = 10) -> list[dict]:
    seeds = seed_titles or ASSUMED_FAVORITE_TITLES
    seed_norm = {t.strip().lower() for t in seeds}

    subjects = _discover_subjects(seeds)[:3]

    # Fetch each subject's books, then interleave (round-robin) so the mix
    # reflects all of the user's genres rather than just the top one.
    per_subject = [_books_in_subject(subject) for subject in subjects]

    results: list[dict] = []
    seen: set[str] = set()
    for rank in range(max((len(books) for books in per_subject), default=0)):
        for books in per_subject:
            if rank >= len(books):
                continue
            book = books[rank]
            key = (book["key"] or book["title"]).lower()
            title_norm = book["title"].strip().lower()
            if key in seen or title_norm in seed_norm:
                continue
            seen.add(key)
            results.append(book)
            if len(results) >= limit:
                return results
    return results
