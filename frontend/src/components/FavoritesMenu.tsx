"use client";

import { useState } from "react";
import { User, X } from "lucide-react";
import { FavoriteBook } from "@/lib/api";

interface FavoritesMenuProps {
  favorites: FavoriteBook[];
  onRemove: (id: number) => void;
}

export default function FavoritesMenu({ favorites, onRemove }: FavoritesMenuProps) {
  const [open, setOpen] = useState(false);

  function handleRecommendClick() {
    console.log("Recommendation button was clicked");
  }

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="p-2 rounded-full hover:bg-zinc-100 transition-colors" aria-label="Favorite books">
        <User className="w-5 h-5 text-zinc-600" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-zinc-200 rounded-lg shadow-lg z-30 flex flex-col">
          <div className="px-3 py-2 border-b border-zinc-100">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Favorite Books
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {favorites.length === 0 && (
              <p className="text-xs text-zinc-400 text-center py-4 px-3">
                No favorites yet — heart a book from search to save it here.
              </p>
            )}
            {favorites.map((book) => (
              <div
                key={book.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 transition-colors group"
              >
                {book.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-7 h-10 object-cover rounded-sm shrink-0 bg-zinc-100"
                  />
                ) : (
                  <div className="w-7 h-10 rounded-sm bg-zinc-100 shrink-0" />
                )}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-medium text-zinc-900 truncate">{book.title}</span>
                  <span className="text-xs text-zinc-500 truncate">{book.author}</span>
                </div>
                <button
                  onClick={() => onRemove(book.id)}
                  className="p-1 rounded text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  aria-label={`Remove ${book.title} from favorites`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-zinc-100">
            <button
              onClick={handleRecommendClick}
              className="w-full text-sm font-medium px-3 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
            >
              Recommend Me
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
