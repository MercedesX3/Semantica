"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import ResultCard from "@/components/ResultCard";
import { searchBooks, SearchResult } from "@/lib/api";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await searchBooks(query);
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">Semantica</h1>
          <p className="mt-2 text-zinc-500 text-lg">Search books by meaning, not just keywords.</p>
        </div>

        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={handleSearch}
          loading={loading}
        />

        {error && (
          <div className="w-full rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {searched && !loading && results.length === 0 && !error && (
          <p className="text-zinc-400 text-sm">No results found. Try a different query.</p>
        )}

        {!searched && (
          <p className="text-zinc-400 text-sm">Search for a book by theme, emotion, or idea.</p>
        )}

        <div className="w-full flex flex-col gap-4">
          {results.map((result, i) => (
            <ResultCard key={`${result.book_id}-${result.chunk_index}-${i}`} result={result} />
          ))}
        </div>
      </div>
    </div>
  );
}
