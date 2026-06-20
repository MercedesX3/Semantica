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

nltk.download("punkt_tab", quiet=True)

try:
    spacy.load("en_core_web_sm")
except OSError:
    subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], check=True)

app = FastAPI(title="Semantica API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    conn.commit()

Base.metadata.create_all(bind=engine)

app.include_router(api_router)


@app.get("/")
def root():
    return {"message": "Semantica API is running!"}
