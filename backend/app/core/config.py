import os
from dotenv import load_dotenv

load_dotenv()

AWS_PROFILE = os.getenv("AWS_PROFILE", "default")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
USER_PROFILES_TABLE = os.getenv("DYNAMODB_USER_PROFILES_TABLE", "user_profiles")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is missing. Add it to your backend .env file."
    )

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)

AUTH_COOKIE_NAME = os.getenv(
    "AUTH_COOKIE_NAME",
    "semantica_access_token",
)

COOKIE_SECURE = (
    os.getenv("COOKIE_SECURE", "false").lower() == "true"
)

FRONTEND_ORIGIN = os.getenv(
    "FRONTEND_ORIGIN",
    "http://localhost:3000",
)

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
