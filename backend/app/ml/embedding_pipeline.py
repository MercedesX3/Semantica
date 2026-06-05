from sentence_transformers import SentenceTransformer
from app.core.config import settings

model = SentenceTransformer(settings.EMBEDDING_MODEL)


def get_embedding(text: str):
    return model.encode(text).tolist()