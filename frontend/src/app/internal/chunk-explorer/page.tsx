"use client";

import { useState, useEffect } from "react";
import { Tags, HeartPulse } from "lucide-react";
import BookLookupHeader from "@/components/BookLookupHeader";
import SearchBar from "@/components/SearchBar";
import ResultCard from "@/components/ResultCard";
import BookSelector from "@/components/BookSelector";
import ChunkChart from "@/components/ChunkChart";
import BookUploadModal from "@/components/BookUploadModal";
import {
  searchBooks,
  getBooks,
  getVisualization,
  SearchResult,
  BookSummary,
  VisualizationData,
  VisualizationMode,
} from "@/lib/api";

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [vizMode, setVizMode] = useState<VisualizationMode>("topic");
  const [vizData, setVizData] = useState<VisualizationData | null>(null);
  const [vizLoading, setVizLoading] = useState(false);
  const [vizError, setVizError] = useState<string | null>(null);

  useEffect(() => {
    getBooks().then(setBooks).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedBookId == null) return;
    let cancelled = false;
    setVizData(null);
    setVizError(null);
    setVizLoading(true);
    getVisualization(selectedBookId, vizMode)
      .then((data) => {
        if (!cancelled) setVizData(data);
      })
      .catch((e) => {
        if (!cancelled) setVizError(e instanceof Error ? e.message : "Failed to load visualization");
      })
      .finally(() => {
        if (!cancelled) setVizLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBookId, vizMode]);

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
    <div className="mx-8 my-4 min-h-[calc(100vh-2rem)] bg-zinc-50 flex flex-col">
      {showUpload && (
        <BookUploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            getBooks().then(setBooks).catch(() => {});
          }}
        />
      )}

      <BookLookupHeader />

      <div className="flex flex-1">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-r border-zinc-200 bg-white flex flex-col p-4 gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Chunk Explorer
          </h2>
          <button
            onClick={() => setShowUpload(true)}
            className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
          >
            + Add Book
          </button>
        </div>
        <BookSelector
          books={books}
          selectedId={selectedBookId}
          onSelect={setSelectedBookId}
        />

        {selectedBookId != null && (
          <div className="flex gap-1 p-1 bg-zinc-100 rounded-lg">
            <button
              onClick={() => setVizMode("topic")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                vizMode === "topic" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Tags className="w-3.5 h-3.5" />
              Topic
            </button>
            <button
              onClick={() => setVizMode("emotion")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                vizMode === "emotion" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              Emotion
            </button>
          </div>
        )}

        {vizLoading && (
          <p className="text-xs text-zinc-400 text-center py-4">Loading visualization...</p>
        )}

        {vizError && (
          <p className="text-xs text-red-500 px-1">{vizError}</p>
        )}

        {vizData && !vizLoading && (
          <ChunkChart data={vizData} mode={vizMode} />
        )}

        {!selectedBookId && !vizLoading && books.length > 0 && (
          <p className="text-xs text-zinc-400 text-center py-2">
            Select a book to explore its chunks
          </p>
        )}

        {books.length === 0 && (
          <p className="text-xs text-zinc-400 text-center py-2">
            No books ingested yet
          </p>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-8 py-16">
        <div className="w-full max-w-2xl flex flex-col items-center gap-8">
          <div className="text-center">
            <h1 className="font-serif italic text-4xl font-bold text-zinc-900 tracking-tight">Semantica</h1>
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
      </main>
      </div>
    </div>
  );
}
