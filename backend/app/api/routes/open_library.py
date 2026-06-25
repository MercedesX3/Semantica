import requests
from fastapi import APIRouter, HTTPException, Query

from app.schemas.external_book import ExternalBookSearchResponse, ExternalBookResult

router = APIRouter()

OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"
OPEN_LIBRARY_COVER_URL = "https://covers.openlibrary.org/b/id/{cover_id}-M.jpg"

# A plain requests.get() opens a fresh connection (DNS + TLS handshake) every
# call, which was taking 1.5-2.7s on its own — easy to blow past a tight
# timeout when this process is also busy with ML inference. A shared Session
# reuses the underlying connection (keep-alive) across requests instead.
_session = requests.Session()


@router.get("/search", response_model=ExternalBookSearchResponse)
def search_open_library(q: str = Query(..., min_length=1), limit: int = Query(default=8, ge=1, le=20)):
    """Proxies Open Library's search API server-side — their API doesn't send
    CORS headers, so the browser can't call it directly."""
    params = {"q": q, "fields": "key,title,author_name,cover_i", "limit": limit}

    response = None
    last_error: Exception | None = None
    for _ in range(2):  # one retry for transient blips
        try:
            response = _session.get(OPEN_LIBRARY_SEARCH_URL, params=params, timeout=10)
            response.raise_for_status()
            last_error = None
            break
        except requests.RequestException as e:
            last_error = e
            response = None

    if last_error is not None:
        raise HTTPException(status_code=502, detail=f"Open Library lookup failed: {type(last_error).__name__}")

    docs = response.json().get("docs", [])

    results = [
        ExternalBookResult(
            key=doc["key"],
            title=doc.get("title", "Untitled"),
            author=(doc.get("author_name") or ["Unknown author"])[0],
            cover_url=OPEN_LIBRARY_COVER_URL.format(cover_id=doc["cover_i"]) if doc.get("cover_i") else None,
        )
        for doc in docs
    ]

    return ExternalBookSearchResponse(query=q, results=results)
