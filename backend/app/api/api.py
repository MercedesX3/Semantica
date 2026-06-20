from fastapi import APIRouter
from app.api.routes import books, embeddings, recommendations, visualization, analysis

api_router = APIRouter()

api_router.include_router(books.router, prefix="/books", tags=["Books"])
api_router.include_router(embeddings.router, prefix="/embeddings", tags=["Embeddings"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
api_router.include_router(visualization.router, prefix="/visualization", tags=["Visualization"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])