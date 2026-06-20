from pydantic import BaseModel


class ChunkAnalysisResult(BaseModel):
    chunk_id: int
    chunk_index: int
    emotion: str
    emotion_scores: dict[str, float]
    sentiment: str
    intensity: float
    pacing: float
    dialogue_density: float
    characters: list[str]

    model_config = {"from_attributes": True}


class BookAnalysisResponse(BaseModel):
    book_id: int
    chunk_count: int
    results: list[ChunkAnalysisResult]


class ThemeArcResponse(BaseModel):
    book_id: int
    beginning_emotion: str
    middle_emotion: str
    end_emotion: str
    theme_arc: str
