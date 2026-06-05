from app.ml.embedding_pipeline import get_embedding


def embed_chunks(chunks: list[str]) -> list[list[float]]:
    return [get_embedding(chunk) for chunk in chunks]
