from pydantic import BaseModel, Field


class IngestRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    author: str = Field(..., min_length=1, max_length=300)
    text: str = Field(..., min_length=100)


class IngestResponse(BaseModel):
    id: int
    title: str
    author: str
    chunk_count: int
    analysis_job_id: int
    message: str


class BookSummary(BaseModel):
    id: int
    title: str
    author: str
    chunk_count: int | None

    model_config = {"from_attributes": True}


class SearchResultItem(BaseModel):
    book_id: int
    title: str
    author: str
    chunk_text: str
    chunk_index: int
    similarity: float


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResultItem]
