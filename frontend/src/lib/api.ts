const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface SearchResult {
  book_id: number;
  title: string;
  author: string;
  chunk_text: string;
  chunk_index: number;
  similarity: number;
}

export async function searchBooks(query: string, k = 5): Promise<SearchResult[]> {
  const res = await fetch(
    `${API_BASE}/books/search?q=${encodeURIComponent(query)}&k=${k}`
  );
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  return data.results;
}
