const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface SearchResult {
  book_id: number;
  title: string;
  author: string;
  chunk_text: string;
  chunk_index: number;
  similarity: number;
}

export interface BookSummary {
  id: number;
  title: string;
  author: string;
  chunk_count: number | null;
}

export interface ChunkPoint {
  chunk_index: number;
  x: number;
  y: number;
  text_preview: string;
  word_count: number | null;
}

export interface VisualizationData {
  book_id: number;
  title: string;
  author: string;
  points: ChunkPoint[];
  variance_explained: number[];
  axis_labels: string[] | null;
}

export async function searchBooks(query: string, k = 5): Promise<SearchResult[]> {
  const res = await fetch(
    `${API_BASE}/books/search?q=${encodeURIComponent(query)}&k=${k}`
  );
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  return data.results;
}

export async function getBooks(): Promise<BookSummary[]> {
  const res = await fetch(`${API_BASE}/books/`);
  if (!res.ok) throw new Error(`Failed to load books: ${res.status}`);
  return res.json();
}

export type VisualizationMode = "topic" | "emotion";

export async function getVisualization(
  bookId: number,
  mode: VisualizationMode = "topic"
): Promise<VisualizationData> {
  const res = await fetch(`${API_BASE}/visualization/books/${bookId}?mode=${mode}`);
  if (!res.ok) throw new Error(`Failed to load visualization: ${res.status}`);
  return res.json();
}

export interface ExternalBookResult {
  key: string;
  title: string;
  author: string;
  cover_url: string | null;
}

export async function searchOpenLibrary(query: string, limit = 8): Promise<ExternalBookResult[]> {
  const res = await fetch(
    `${API_BASE}/open-library/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!res.ok) throw new Error(`Open Library search failed: ${res.status}`);
  const data = await res.json();
  return data.results;
}

export interface FavoriteBook {
  id: number;
  open_library_key: string;
  title: string;
  author: string;
  cover_url: string | null;
  created_at: string;
}

export async function getFavorites(): Promise<FavoriteBook[]> {
  const res = await fetch(`${API_BASE}/favorites/`);
  if (!res.ok) throw new Error(`Failed to load favorites: ${res.status}`);
  return res.json();
}

export async function addFavorite(book: ExternalBookResult): Promise<FavoriteBook> {
  const res = await fetch(`${API_BASE}/favorites/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      open_library_key: book.key,
      title: book.title,
      author: book.author,
      cover_url: book.cover_url,
    }),
  });
  if (!res.ok) throw new Error(`Failed to add favorite: ${res.status}`);
  return res.json();
}

export async function removeFavorite(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/favorites/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to remove favorite: ${res.status}`);
}
