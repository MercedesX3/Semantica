const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const TRENDING_API_BASE = process.env.NEXT_PUBLIC_TRENDING_API_URL ?? "";

/** Public Open Library, used directly when our own API is unreachable. */
const OPEN_LIBRARY = "https://openlibrary.org";
const OPEN_LIBRARY_COVERS = "https://covers.openlibrary.org";

/**
 * How long to wait before giving up on a request.
 *
 * Our own API gets a short budget — when it isn't running we want to fail
 * fast and fall back. Open Library gets a much longer one: its subject
 * searches routinely take five to fifteen seconds, and cutting them off
 * early left screens stuck on "Loading…".
 */
const TIMEOUT_OWN_API = 3000;
const TIMEOUT_UPSTREAM = 20000;

/**
 * fetch with a hard timeout. Without this, a Semantica backend that isn't
 * running leaves requests pending until the browser gives up, so every
 * screen sits in a loading state instead of falling back.
 */
async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = TIMEOUT_OWN_API) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Strip a leading slash / "works/" prefix off an Open Library work key. */
export function normalizeWorkKey(ref: string | number): string {
  return String(ref)
    .replace(/^\/+/, "")
    .replace(/^works\//i, "")
    .trim();
}

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
  const res = await fetchWithTimeout(`${API_BASE}/books/`);
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

/**
 * Cover-rich recommendations seeded from the user's favourites.
 *
 * This lives on the Semantica API, not the trending gateway — pointing it at
 * TRENDING_API_BASE meant it 404'd against the deployed Lambda every time.
 */
export async function getForYouRecommendations(limit = 10): Promise<ForYouBook[]> {
  const res = await fetchWithTimeout(`${API_BASE}/recommendations/for-you?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to load recommendations: ${res.status}`);
  const data = await res.json();
  return data.results;
}

/**
 * Fallback picks built from the genres the reader chose during onboarding.
 * Weaker than the embedding-based recommender, but real, explainable, and
 * available without a backend — so Browse is never an empty screen.
 */
export async function getPicksByGenres(genres: string[], limit = 10): Promise<ForYouBook[]> {
  if (genres.length === 0) return [];

  const chosen = genres.slice(0, 3);
  const perGenre = Math.max(3, Math.ceil(limit / chosen.length));

  const batches = await Promise.all(
    chosen.map(async (genre) => {
      try {
        const results = await searchOpenLibrary(`subject:"${genre}"`, perGenre);
        return results.map((book) => ({
          key: book.key,
          title: book.title,
          author: book.author,
          cover_url: book.cover_url,
          genre,
          subject: genre,
        }));
      } catch {
        return [];
      }
    })
  );

  // Interleave so the rail isn't three genre blocks in a row.
  const merged: ForYouBook[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < perGenre; i++) {
    for (const batch of batches) {
      const item = batch[i];
      if (!item || !item.key || seen.has(item.key)) continue;
      seen.add(item.key);
      merged.push(item);
    }
  }
  return merged.slice(0, limit);
}

export interface TrendingBook {
  source: "open_library" | "nytimes";
  category: string;

  source_rank: number;
  source_id?: string;

  title: string;
  author: string;

  description?: string;

  isbn_13?: string;
  isbn_10?: string;

  cover_url?: string;
  source_url?: string;

  first_publish_year?: number;

  publisher?: string;
  weeks_on_list?: number;

  trending_score?: number;
  activity_24h?: number;

  fetched_at?: string;
}

export interface TrendingBooksResponse {
  total_books: number;
  open_library: TrendingBook[];
  nytimes: TrendingBook[];
}

export interface ExternalBookResult {
  key: string;
  title: string;
  author: string;
  cover_url: string | null;
}

interface OpenLibrarySearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

/** Search books. Prefers our API; falls back to public Open Library. */
export async function searchOpenLibrary(query: string, limit = 8): Promise<ExternalBookResult[]> {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/open-library/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results)) return data.results;
    }
  } catch {
    // fall through to the public API below
  }

  const res = await fetchWithTimeout(
    `${OPEN_LIBRARY}/search.json?q=${encodeURIComponent(query)}&limit=${limit}` +
      `&fields=key,title,author_name,cover_i`,
    {},
    TIMEOUT_UPSTREAM
  );
  if (!res.ok) throw new Error(`Book search failed: ${res.status}`);
  const data: { docs?: OpenLibrarySearchDoc[] } = await res.json();

  return (data.docs ?? []).map((doc) => ({
    key: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] ?? "Unknown author",
    cover_url: doc.cover_i ? `${OPEN_LIBRARY_COVERS}/b/id/${doc.cover_i}-M.jpg` : null,
  }));
}

/**
 * Open Library subjects are a mix of real themes and library-shelf metadata.
 * Taking subjects[0] blindly gave books a "genre" of "New York Times
 * bestseller" and then recommended every other bestseller as a similar read.
 */
const SUBJECT_NOISE =
  /bestseller|new york times|nyt|accessible book|protected daisy|in library|overdrive|large type|reading level|lending library|award|open library staff picks|popular print|book club|collections|readers|specimens|translations into/i;

/** Subjects that map cleanly onto a genre we already have a swatch for. */
const SUBJECT_GENRE_HINTS: [RegExp, string][] = [
  [/science fiction/i, "Science Fiction"],
  [/fantasy|magic|wizard/i, "Fantasy"],
  [/horror|ghost|haunt/i, "Horror"],
  [/dystopi|post-apocalyp/i, "Dystopian"],
  [/detective|mystery|crime/i, "Mystery"],
  [/thriller|suspense/i, "Thriller"],
  [/romance|love stories/i, "Romance"],
  [/historical fiction|historical/i, "Historical"],
  [/poetry|poems/i, "Poetry"],
  [/classic literature|classics/i, "Classic"],
  [/biography|memoir|history|essays/i, "Non Fiction"],
];

/**
 * Pick the most useful subject to show as a genre and to search neighbours by.
 * Prefers a recognisable genre, then the first non-noise subject.
 */
export function pickSubject(subjects?: string[]): string | null {
  if (!subjects || subjects.length === 0) return null;
  const usable = subjects.filter((s) => s && !SUBJECT_NOISE.test(s));

  for (const [pattern, genre] of SUBJECT_GENRE_HINTS) {
    if (usable.some((s) => pattern.test(s))) return genre;
  }

  // Fall back to the first short, topic-shaped subject.
  const topical = usable.find((s) => s.length <= 30 && !/\d/.test(s));
  return topical ?? usable[0] ?? null;
}

/**
 * Books that share a subject with the one being viewed. Real relations from
 * Open Library rather than an invented "similar books" list — the semantic
 * version replaces this once a book has been ingested and embedded.
 */
export async function getRelatedBooks(
  subject: string,
  excludeKey: string,
  limit = 8
): Promise<ExternalBookResult[]> {
  const results = await searchOpenLibrary(`subject:"${subject}"`, limit + 4);
  const excluded = normalizeWorkKey(excludeKey);
  return results.filter((book) => normalizeWorkKey(book.key) !== excluded).slice(0, limit);
}

/** Trending books from the external trending API gateway (NYT + Open Library). */
export async function getTrendingBooks(): Promise<TrendingBooksResponse> {
  const base = TRENDING_API_BASE || API_BASE;
  const res = await fetchWithTimeout(`${base}/trending-books`, {}, TIMEOUT_UPSTREAM);

  if (!res.ok) {
    throw new Error(`Failed to fetch trending books: ${res.status}`);
  }

  return res.json();
}

/**
 * Books to show in onboarding before the reader has typed a search.
 *
 * These used to be a hardcoded list with hardcoded Open Library cover ids,
 * and the ids had gone stale — Circe rendered as "Faces in the Crowd" and
 * Evelyn Hugo as a Llama Llama picture book. Resolving them at runtime keeps
 * every cover matched to its actual title.
 */
export async function getStarterBooks(limit = 12): Promise<ExternalBookResult[]> {
  try {
    const trending = await getTrendingBooks();
    const combined = [...trending.open_library, ...trending.nytimes]
      .filter((book) => book.cover_url && book.source_id)
      .map((book) => ({
        key: book.source_id as string,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url ?? null,
      }));
    if (combined.length >= 6) return combined.slice(0, limit);
  } catch {
    // fall through to a plain popular-fiction search
  }

  try {
    return await searchOpenLibrary('subject:"Fiction"', limit);
  } catch {
    return [];
  }
}

export interface FavoriteBook {
  id: number;
  open_library_key: string;
  title: string;
  author: string;
  cover_url: string | null;
  created_at: string;
}

/**
 * Favourites fall back to a local shelf when the API is unreachable, so
 * hearting and saving a book still works end to end without a backend.
 * Local entries use negative ids to stay distinguishable from server rows.
 */
const LOCAL_SHELF_KEY = "semantica.shelf.v1";

function readLocalShelf(): FavoriteBook[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_SHELF_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalShelf(books: FavoriteBook[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_SHELF_KEY, JSON.stringify(books));
  } catch {
    // storage full or blocked — the in-memory state still holds for this session
  }
}

export async function getFavorites(): Promise<FavoriteBook[]> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/favorites/`);
    if (res.ok) return await res.json();
  } catch {
    // fall through
  }
  return readLocalShelf();
}

export async function addFavorite(book: ExternalBookResult): Promise<FavoriteBook> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/favorites/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        open_library_key: book.key,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
      }),
    });
    if (res.ok) return await res.json();
  } catch {
    // fall through
  }

  const shelf = readLocalShelf();
  const existing = shelf.find((b) => b.open_library_key === book.key);
  if (existing) return existing;

  const favorite: FavoriteBook = {
    id: -Date.now(),
    open_library_key: book.key,
    title: book.title,
    author: book.author,
    cover_url: book.cover_url,
    created_at: new Date().toISOString(),
  };
  writeLocalShelf([favorite, ...shelf]);
  return favorite;
}

export async function removeFavorite(id: number): Promise<void> {
  if (id < 0) {
    writeLocalShelf(readLocalShelf().filter((b) => b.id !== id));
    return;
  }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/favorites/${id}`, { method: "DELETE" });
    if (res.ok) return;
  } catch {
    // fall through
  }
  writeLocalShelf(readLocalShelf().filter((b) => b.id !== id));
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

/**
 * The detail endpoint returns everything in PlaylistSummary *except*
 * `chapter_count` and `cover_url`, so those are re-declared optional here.
 * Derive the chapter count from `chapters.length` rather than trusting it.
 */
export interface BookPlaylist extends Omit<PlaylistSummary, "chapter_count" | "cover_url"> {
  chapter_count?: number;
  cover_url?: string | null;
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
  const res = await fetchWithTimeout(`${API_BASE}/playlists/`);
  if (!res.ok) throw new Error(`Failed to load playlists: ${res.status}`);
  return res.json();
}

export async function getBookPlaylist(bookId: number): Promise<BookPlaylist> {
  const res = await fetchWithTimeout(`${API_BASE}/playlists/books/${bookId}`);
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

  const normalizedRef = normalizeWorkKey(decodedRef);

  let res: Response | null = null;
  try {
    res = await fetchWithTimeout(`${API_BASE}/books/${encodeURIComponent(normalizedRef)}`);
  } catch {
    res = null;
  }

  if (!res || !res.ok) {
    // Our API is unavailable (or doesn't know this book). If the reference
    // looks like an Open Library work, read it straight from Open Library so
    // the detail page still renders.
    if (/^OL\w+W$/i.test(normalizedRef)) {
      return getOpenLibraryWork(normalizedRef);
    }
    throw new Error(`Failed to load book: ${res ? res.status : "network error"}`);
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

interface OpenLibraryWork {
  title?: string;
  description?: string | { value?: string };
  subjects?: string[];
  covers?: number[];
  authors?: { author?: { key?: string } }[];
}

/** Read a work directly from public Open Library (no Semantica backend needed). */
async function getOpenLibraryWork(workKey: string): Promise<BookDetails> {
  const res = await fetchWithTimeout(`${OPEN_LIBRARY}/works/${workKey}.json`, {}, TIMEOUT_UPSTREAM);
  if (!res.ok) throw new Error(`Failed to load book: ${res.status}`);
  const work: OpenLibraryWork = await res.json();

  const description =
    typeof work.description === "string"
      ? work.description
      : work.description?.value ?? null;

  // Author and ratings each live behind their own endpoint; neither is
  // essential, so a failure just leaves the field blank.
  const [author, ratings] = await Promise.all([
    (async () => {
      const authorKey = work.authors?.[0]?.author?.key;
      if (!authorKey) return "Unknown author";
      try {
        const r = await fetchWithTimeout(`${OPEN_LIBRARY}${authorKey}.json`, {}, TIMEOUT_UPSTREAM);
        if (!r.ok) return "Unknown author";
        const a: { name?: string } = await r.json();
        return a.name ?? "Unknown author";
      } catch {
        return "Unknown author";
      }
    })(),
    (async () => {
      try {
        const r = await fetchWithTimeout(`${OPEN_LIBRARY}/works/${workKey}/ratings.json`, {}, TIMEOUT_UPSTREAM);
        if (!r.ok) return null;
        const d: { summary?: { average?: number | null; count?: number | null } } = await r.json();
        return d.summary ?? null;
      } catch {
        return null;
      }
    })(),
  ]);

  return {
    id: workKey,
    title: work.title ?? "Untitled",
    author,
    genre: pickSubject(work.subjects),
    rating: ratings?.average ?? null,
    ratings: ratings?.count ?? null,
    coverUrl: work.covers?.[0] ? `${OPEN_LIBRARY_COVERS}/b/id/${work.covers[0]}-L.jpg` : null,
    // Open Library descriptions often end with a "----- [source][1]" footer.
    description: description ? description.replace(/\r?\n-{3,}[\s\S]*$/i, "").trim() : null,
    source: "open_library",
    openLibraryKey: `/works/${workKey}`,
    chunkCount: null,
  };
}

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