# Semantica

A semantic book search engine. Search for books by meaning, theme, or emotion — not just keywords.

Built with FastAPI, PostgreSQL + pgvector, Sentence Transformers, and Next.js.

---

## How It Works

1. A book is ingested by splitting its text into overlapping chunks (~400 words each)
2. Each chunk is embedded into a 384-dimensional vector using `all-MiniLM-L6-v2`
3. Vectors are stored in PostgreSQL via the pgvector extension
4. At search time, the query is embedded the same way and the closest chunks are returned using cosine similarity

---

## Project Structure

```
Semantica/
├── backend/          # FastAPI backend
│   └── app/
│       ├── api/      # Route handlers
│       ├── core/     # Database + config
│       ├── ml/       # Embedding pipeline
│       ├── models/   # SQLAlchemy ORM models
│       ├── schemas/  # Pydantic request/response shapes
│       └── services/ # Chunking + embedding logic
├── frontend/         # Next.js frontend
│   └── src/
│       ├── app/      # Pages
│       ├── components/
│       └── lib/      # API client
├── books/            # Book text files for ingestion
└── docker-compose.yml
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Python 3.13+
- Node.js 18+

---

## Setup

### 1. Start the database

```bash
docker compose up -d
```

### 2. Set up the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Start the backend server

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive API docs at `http://localhost:8000/docs`.

### 4. Set up and start the frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Ingesting a Book

With the backend running, POST a book's text to the ingest endpoint:

```bash
curl -X POST http://localhost:8000/books/ingest \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Pride and Prejudice\", \"author\": \"Jane Austen\", \"text\": $(cat 'books/Pride and Prejudice.txt' | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}"
```

Ingestion chunks the book, embeds each chunk, and stores everything in the database. This may take 1–2 minutes for a full novel.

---

## Searching

```bash
curl "http://localhost:8000/books/search?q=marriage+and+social+class&k=5"
```

Or use the search UI at `http://localhost:3000`.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/books/` | List all ingested books |
| POST | `/books/ingest` | Ingest a new book |
| GET | `/books/search?q=<query>&k=<n>` | Semantic search |
| GET | `/embeddings/health` | Embedding model status |

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | FastAPI + Uvicorn |
| Database | PostgreSQL 16 + pgvector |
| ORM | SQLAlchemy 2 |
| Embeddings | Sentence Transformers (`all-MiniLM-L6-v2`) |
| Frontend | Next.js 16 + Tailwind CSS |
| Container | Docker |
