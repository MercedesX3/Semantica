from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health")
def embedding_health():
    return {
        "status": "ok",
        "model": settings.EMBEDDING_MODEL,
        "dim": settings.EMBEDDING_DIM,
    }
