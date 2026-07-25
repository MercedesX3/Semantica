"""Spotify Client-Credentials client — Search endpoint only.

Audio Features / Recommendations were deprecated for new apps (Nov 2024), so
we deliberately only call /v1/search and /v1/genres is unused."""

from __future__ import annotations

import base64
import time
from typing import Any

import requests

from app.core.config import settings

_TOKEN_URL = "https://accounts.spotify.com/api/token"
_SEARCH_URL = "https://api.spotify.com/v1/search"

_session = requests.Session()
_cached_token: str | None = None
_token_expires_at: float = 0.0


def spotify_configured() -> bool:
    return bool(settings.SPOTIFY_CLIENT_ID and settings.SPOTIFY_CLIENT_SECRET)


def _get_access_token() -> str:
    global _cached_token, _token_expires_at
    if _cached_token and time.time() < _token_expires_at - 30:
        return _cached_token

    if not spotify_configured():
        raise RuntimeError("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set")

    basic = base64.b64encode(
        f"{settings.SPOTIFY_CLIENT_ID}:{settings.SPOTIFY_CLIENT_SECRET}".encode()
    ).decode()
    res = _session.post(
        _TOKEN_URL,
        headers={
            "Authorization": f"Basic {basic}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={"grant_type": "client_credentials"},
        timeout=10,
    )
    res.raise_for_status()
    payload = res.json()
    _cached_token = payload["access_token"]
    _token_expires_at = time.time() + int(payload.get("expires_in", 3600))
    return _cached_token


def search_tracks(query: str, limit: int = 5) -> list[dict[str, Any]]:
    """Search Spotify for tracks matching a mood query.

    Returns a list of {id, name, artist, album, duration_ms, preview_url,
    external_url, image_url}. Raises on HTTP errors when credentials exist.
    """
    token = _get_access_token()
    res = _session.get(
        _SEARCH_URL,
        headers={"Authorization": f"Bearer {token}"},
        params={"q": query, "type": "track", "limit": limit},
        timeout=10,
    )
    res.raise_for_status()
    items = res.json().get("tracks", {}).get("items", [])

    tracks = []
    for item in items:
        images = (item.get("album") or {}).get("images") or []
        tracks.append({
            "id": item.get("id"),
            "name": item.get("name", "Untitled"),
            "artist": (item.get("artists") or [{"name": "Unknown"}])[0]["name"],
            "album": (item.get("album") or {}).get("name"),
            "duration_ms": item.get("duration_ms") or 0,
            "preview_url": item.get("preview_url"),
            "external_url": (item.get("external_urls") or {}).get("spotify"),
            "image_url": images[0]["url"] if images else None,
        })
    return tracks
