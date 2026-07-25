from pydantic import BaseModel


class PlaylistTrack(BaseModel):
    id: str | None = None
    name: str
    artist: str
    album: str | None = None
    duration_ms: int = 0
    preview_url: str | None = None
    external_url: str | None = None
    image_url: str | None = None


class ChapterMood(BaseModel):
    query: str
    genre: str
    mood_label: str
    emotion: str
    sentiment: str
    pacing: float
    theme: str | None = None
    energy: str


class ChapterPlaylist(BaseModel):
    chapter_index: int
    title: str
    mood: ChapterMood
    tracks: list[PlaylistTrack]


class BookPlaylistResponse(BaseModel):
    book_id: int
    book_title: str
    author: str
    playlist_title: str
    track_count: int
    duration: str
    accent_color: str
    spotify_enabled: bool
    chapters: list[ChapterPlaylist]
    tracks: list[PlaylistTrack]


class PlaylistSummary(BaseModel):
    book_id: int
    book_title: str
    author: str
    playlist_title: str
    track_count: int
    duration: str
    accent_color: str
    chapter_count: int
    spotify_enabled: bool
    cover_url: str | None = None
