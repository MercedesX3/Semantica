import subprocess
import sys
import nltk
import spacy
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.database import engine, Base
from app.models import Book, BookChunk  # registers models with Base
from app.api.api import api_router
from app.api.users import router as user_router
from app.core.config import FRONTEND_ORIGIN

nltk.download("punkt_tab", quiet=True)

try:
    spacy.load("en_core_web_sm")
except OSError:
    subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], check=True)

app = FastAPI(title="Semantica API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_ORIGIN,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    conn.commit()

Base.metadata.create_all(bind=engine)

# Lightweight, idempotent column adds for existing databases (no Alembic in
# this project). create_all only creates missing tables, not missing columns.
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE book_chunks ADD COLUMN IF NOT EXISTS chapter_index INTEGER"))
    conn.execute(text("ALTER TABLE book_chunks ADD COLUMN IF NOT EXISTS chapter_title VARCHAR(200)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_book_chunks_chapter_index ON book_chunks (chapter_index)"))
    conn.commit()

app.include_router(api_router)
app.include_router(user_router)


@app.get("/")
def root():
    return {"message": "Semantica API is running!"}
