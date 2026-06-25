from datetime import datetime
from pydantic import BaseModel


class FavoriteBookCreate(BaseModel):
    open_library_key: str
    title: str
    author: str
    cover_url: str | None = None


class FavoriteBookResponse(BaseModel):
    id: int
    open_library_key: str
    title: str
    author: str
    cover_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
