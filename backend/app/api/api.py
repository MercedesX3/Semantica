from fastapi import APIRouter
from app.api.routes import (
    books,
    embeddings,
    recommendations,
    visualization,
    analysis,
    themes,
    open_library,
    favorites,
    playlists,
)

api_router = APIRouter()

api_router.include_router(books.router, prefix="/books", tags=["Books"])
api_router.include_router(embeddings.router, prefix="/embeddings", tags=["Embeddings"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
api_router.include_router(visualization.router, prefix="/visualization", tags=["Visualization"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
api_router.include_router(themes.router, prefix="/themes", tags=["Themes"])
api_router.include_router(open_library.router, prefix="/open-library", tags=["Open Library"])
api_router.include_router(favorites.router, prefix="/favorites", tags=["Favorites"])
api_router.include_router(playlists.router, prefix="/playlists", tags=["Playlists"])
