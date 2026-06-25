"use client";

import { useState, useEffect, useRef } from "react";
import { Search, BookOpen, Heart } from "lucide-react";
import {
  searchOpenLibrary,
  getFavorites,
  addFavorite,
  removeFavorite,
  ExternalBookResult,
  FavoriteBook,
} from "@/lib/api";
import FavoritesMenu from "@/components/FavoritesMenu";

export default function BookLookupHeader() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExternalBookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getFavorites().then(setFavorites).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const debounce = setTimeout(() => {
      setLoading(true);
      searchOpenLibrary(trimmed)
        .then((data) => {
          if (cancelled) return;
          setResults(data);
          setOpen(true);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
  }, [query]);

  function getFavoriteId(key: string): number | undefined {
    return favorites.find((f) => f.open_library_key === key)?.id;
  }

  async function toggleFavorite(book: ExternalBookResult) {
    const existingId = getFavoriteId(book.key);
    if (existingId != null) {
      setFavorites((prev) => prev.filter((f) => f.id !== existingId));
      removeFavorite(existingId).catch(() => {
        getFavorites().then(setFavorites).catch(() => {});
      });
    } else {
      try {
        const favorite = await addFavorite(book);
        setFavorites((prev) => [favorite, ...prev]);
      } catch {
        // ignore — favorite just won't appear
      }
    }
  }

  function handleRemoveFavorite(id: number) {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    removeFavorite(id).catch(() => {
      getFavorites().then(setFavorites).catch(() => {});
    });
  }

  return (
    <header className="w-full border-b border-zinc-200 bg-white px-6 py-3 flex items-center justify-between relative z-20">
      <FavoritesMenu favorites={favorites} onRemove={handleRemoveFavorite} />

      <div ref={containerRef} className="relative w-full max-w-md">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 focus-within:ring-2 focus-within:ring-zinc-300">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Look up a book by title or author..."
            className="flex-1 bg-transparent outline-none text-sm text-zinc-900 placeholder-zinc-400"
          />
        </div>

        {open && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white border border-zinc-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-30">
            {loading && <p className="text-xs text-zinc-400 text-center py-4">Searching...</p>}

            {!loading && results.length === 0 && (
              <p className="text-xs text-zinc-400 text-center py-4">No books found</p>
            )}

            {!loading &&
              results.map((book) => {
                const isFavorited = getFavoriteId(book.key) != null;
                return (
                  <div
                    key={book.key}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 transition-colors"
                  >
                    {book.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-8 h-12 object-cover rounded-sm shrink-0 bg-zinc-100"
                      />
                    ) : (
                      <div className="w-8 h-12 rounded-sm bg-zinc-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-zinc-300" />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium text-zinc-900 truncate">{book.title}</span>
                      <span className="text-xs text-zinc-500 truncate">{book.author}</span>
                    </div>
                    <button
                      onClick={() => toggleFavorite(book)}
                      className="p-1.5 rounded-full hover:bg-zinc-100 transition-colors shrink-0"
                      aria-label={isFavorited ? `Remove ${book.title} from favorites` : `Favorite ${book.title}`}
                    >
                      <Heart
                        className={`w-4 h-4 ${isFavorited ? "text-[#E1367C]" : "text-zinc-300"}`}
                        fill={isFavorited ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* spacer to balance the profile icon so the search bar stays visually centered */}
      <div className="w-9 shrink-0" />
    </header>
  );
}
