from datetime import datetime
from pydantic import BaseModel


class ThemeJobResponse(BaseModel):
    job_id: int
    book_id: int
    status: str


class ThemeJobStatusResponse(BaseModel):
    job_id: int
    book_id: int
    status: str
    error: str | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class ChapterThemeResult(BaseModel):
    chapter_index: int
    title: str | None
    themes: list[dict]

    model_config = {"from_attributes": True}


class BookThemeProfileResponse(BaseModel):
    book_id: int
    chapter_count: int
    themes: list[dict]
    chapters: list[ChapterThemeResult]
