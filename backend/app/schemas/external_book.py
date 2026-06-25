from pydantic import BaseModel


class ExternalBookResult(BaseModel):
    key: str
    title: str
    author: str
    cover_url: str | None


class ExternalBookSearchResponse(BaseModel):
    query: str
    results: list[ExternalBookResult]
