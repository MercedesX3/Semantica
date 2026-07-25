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

/** Top daily trending books from Open Library (with covers). */
export async function getTrendingBooks(limit = 10): Promise<ExternalBookResult[]> {
  const res = await fetch(`${API_BASE}/open-library/trending?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to load trending books: ${res.status}`);
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

export interface PlaylistTrack {
  id: string | null;
  name: string;
  artist: string;
  album: string | null;
  duration_ms: number;
  preview_url: string | null;
  external_url: string | null;
  image_url: string | null;
}

export interface PlaylistSummary {
  book_id: number;
  book_title: string;
  author: string;
  playlist_title: string;
  track_count: number;
  duration: string;
  accent_color: string;
  chapter_count: number;
  spotify_enabled: boolean;
  cover_url: string | null;
}

export interface BookPlaylist extends PlaylistSummary {
  chapters: {
    chapter_index: number;
    title: string;
    mood: {
      query: string;
      genre: string;
      mood_label: string;
      emotion: string;
      sentiment: string;
      pacing: number;
      theme: string | null;
      energy: string;
    };
    tracks: PlaylistTrack[];
  }[];
  tracks: PlaylistTrack[];
}

export async function listPlaylists(): Promise<PlaylistSummary[]> {
  const res = await fetch(`${API_BASE}/playlists/`);
  if (!res.ok) throw new Error(`Failed to load playlists: ${res.status}`);
  return res.json();
}

export async function getBookPlaylist(bookId: number): Promise<BookPlaylist> {
  const res = await fetch(`${API_BASE}/playlists/books/${bookId}`);
  if (!res.ok) throw new Error(`Failed to load playlist: ${res.status}`);
  return res.json();
}

export interface BookDetails {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  rating: number | null;
  ratings: number | null;
  coverUrl: string | null;
  description: string | null;
  source?: string;
  openLibraryKey?: string | null;
  chunkCount?: number | null;
}

interface BookDetailsResponse {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  rating: number | null;
  ratings: number | null;
  cover_url: string | null;
  description: string | null;
  source?: string;
  open_library_key?: string | null;
  chunk_count?: number | null;
}

/** Detail for an ingested book id or an Open Library work key (e.g. OL17930368W). */
export async function getBookInfo(bookRef: string | number): Promise<BookDetails> {
  const decodedRef = typeof bookRef === "string"
    ? decodeURIComponent(bookRef).trim()
    : String(bookRef);

  const normalizedRef = decodedRef
    .replace(/^\/+/, "")
    .replace(/^works\//i, "")
    .trim();

  const res = await fetch(`${API_BASE}/books/${encodeURIComponent(normalizedRef)}`);

  if (!res.ok) {
    throw new Error(`Failed to load book: ${res.status}`);
  }

  const data: BookDetailsResponse = await res.json();

  return {
    id: data.id,
    title: data.title,
    author: data.author,
    genre: data.genre,
    rating: data.rating,
    ratings: data.ratings,
    coverUrl: data.cover_url,
    description: data.description,
    source: data.source,
    openLibraryKey: data.open_library_key,
    chunkCount: data.chunk_count,
  };
}

// Authentication-related API functions

// Authentication-related API functions

export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  last_active_at: string;
  updated_at: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

async function getErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data: unknown = await response.json();

    if (
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof data.detail === "string"
    ) {
      return data.detail;
    }
  } catch {
    // The backend did not return JSON.
  }

  return fallback;
}

/**
 * Creates a user account.
 * The backend also creates the HttpOnly authentication cookie.
 */
export async function registerUser(
  request: RegisterRequest
): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...request,
      email: request.email.trim().toLowerCase(),
    }),
  });

  if (!res.ok) {
    const message = await getErrorMessage(
      res,
      `Registration failed: ${res.status}`
    );

    throw new Error(message);
  }

  return res.json();
}

/**
 * Verifies the email and password.
 * The backend creates the HttpOnly authentication cookie.
 */
export async function loginUser(
  request: LoginRequest
): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: request.email.trim().toLowerCase(),
      password: request.password,
    }),
  });

  if (!res.ok) {
    const message = await getErrorMessage(
      res,
      `Login failed: ${res.status}`
    );

    throw new Error(message);
  }

  return res.json();
}

/**
 * Uses the authentication cookie to retrieve the logged-in user.
 */
export async function getCurrentUser(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const message = await getErrorMessage(
      res,
      "You are not signed in."
    );

    throw new Error(message);
  }

  return res.json();
}

/**
 * Deletes the authentication cookie.
 */
export async function logoutUser(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const message = await getErrorMessage(
      res,
      `Logout failed: ${res.status}`
    );

    throw new Error(message);
  }
}