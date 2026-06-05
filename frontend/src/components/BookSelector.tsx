import { useState } from "react";
import { BookSummary } from "@/lib/api";

interface BookSelectorProps {
  books: BookSummary[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function BookSelector({ books, selectedId, onSelect }: BookSelectorProps) {
  const [query, setQuery] = useState("");

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(query.toLowerCase()) ||
      b.author.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Filter books..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300"
      />
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-xs text-zinc-400 px-2 py-1">No books found</p>
        )}
        {filtered.map((book) => (
          <button
            key={book.id}
            onClick={() => onSelect(book.id)}
            className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedId === book.id
                ? "bg-zinc-900 text-white"
                : "hover:bg-zinc-100 text-zinc-800"
            }`}
          >
            <div className="font-medium truncate">{book.title}</div>
            <div className={`text-xs truncate ${selectedId === book.id ? "text-zinc-300" : "text-zinc-500"}`}>
              {book.author} · {book.chunk_count ?? "?"} chunks
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
