import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # App
    APP_NAME: str = os.getenv("APP_NAME", "StoryDNA")
    ENV: str = os.getenv("ENV", "development")

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/storydna"
    )

    # ML
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    EMBEDDING_DIM: int = int(os.getenv("EMBEDDING_DIM", 384))

    # Search
    SEARCH_SIMILARITY_THRESHOLD: float = float(os.getenv("SEARCH_SIMILARITY_THRESHOLD", 0.35))

    # Spotify (Client Credentials — Search API only; no audio-features)
    SPOTIFY_CLIENT_ID: str = os.getenv("SPOTIFY_CLIENT_ID", "")
    SPOTIFY_CLIENT_SECRET: str = os.getenv("SPOTIFY_CLIENT_SECRET", "")


settings = Settings()
