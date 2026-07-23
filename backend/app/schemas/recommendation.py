from pydantic import BaseModel, Field


class RecommendationItem(BaseModel):
    book_id: int
    title: str
    author: str
    score: float
    semantic: float
    emotion: float
    theme: float
    style: float | None = None


class SimilarBooksResponse(BaseModel):
    book_id: int
    results: list[RecommendationItem]


class ForMeRequest(BaseModel):
    liked_book_ids: list[int] = Field(..., min_length=1)
    disliked_book_ids: list[int] = []
    limit: int = Field(default=10, ge=1, le=50)


class ForMeResponse(BaseModel):
    results: list[RecommendationItem]
