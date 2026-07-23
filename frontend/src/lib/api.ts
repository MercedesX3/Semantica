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

export interface BookDNA {
  book_id: number;
  emotion_profile: {
    mean_scores: Record<string, number>;
    beginning_emotion: string;
    middle_emotion: string;
    end_emotion: string;
    arc_label: string;
    volatility: number;
    peak_emotion: string;
  };
  theme_profile: {
    vector: number[];
    top: { theme: string; confidence: number }[];
  };
  style_profile: {
    avg_pacing: number;
    pacing_variance: number;
    avg_dialogue_density: number;
    character_count: number;
    chunk_count: number;
    avg_word_count: number;
  };
  arc: {
    sentiment_series: number[];
    intensity_series: number[];
    pacing_series: number[];
  };
}

/** Returns the book's DNA, or null if it hasn't been built yet (404). */
export async function getBookDNA(bookId: number): Promise<BookDNA | null> {
  const res = await fetch(`${API_BASE}/analysis/books/${bookId}/dna`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load DNA: ${res.status}`);
  return res.json();
}

export interface ForYouBook {
  key: string | null;
  title: string;
  author: string;
  cover_url: string | null;
  genre: string | null;
  subject: string | null;
}

/** Cover-rich recommendations seeded from the user's favorites. */
export async function getForYouRecommendations(limit = 10): Promise<ForYouBook[]> {
  const res = await fetch(`${API_BASE}/recommendations/for-you?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to load recommendations: ${res.status}`);
  const data = await res.json();
  return data.results;
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
