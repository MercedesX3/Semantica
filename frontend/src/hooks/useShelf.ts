"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  normalizeWorkKey,
  ExternalBookResult,
  FavoriteBook,
} from "@/lib/api";

interface ShelfBook {
  key: string;
  title: string;
  author: string;
  coverUrl?: string | null;
}

/**
 * The user's saved shelf, shared by Browse, Library, Profile and Book Detail.
 *
 * Toggling is optimistic: the UI updates immediately and reconciles against
 * the server (or the local fallback shelf) afterwards.
 */
export function useShelf() {
  const [books, setBooks] = useState<FavoriteBook[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    return getFavorites()
      .then(setBooks)
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Indexed by bare work key (OL…W) so callers don't worry about "/works/" prefixes. */
  const byKey = useMemo(
    () => new Map(books.map((book) => [normalizeWorkKey(book.open_library_key), book])),
    [books]
  );

  const isSaved = useCallback((key?: string | null) => (key ? byKey.has(normalizeWorkKey(key)) : false), [byKey]);

  const toggle = useCallback(
    async (book: ShelfBook) => {
      if (!book.key) return;
      const normalized = normalizeWorkKey(book.key);
      const existing = byKey.get(normalized);

      if (existing) {
        setBooks((prev) => prev.filter((b) => b.id !== existing.id));
        try {
          await removeFavorite(existing.id);
        } catch {
          void refresh();
        }
        return;
      }

      const payload: ExternalBookResult = {
        key: book.key,
        title: book.title,
        author: book.author,
        cover_url: book.coverUrl ?? null,
      };

      // Optimistic placeholder until the real row comes back.
      const optimistic: FavoriteBook = {
        id: -Date.now(),
        open_library_key: book.key,
        title: book.title,
        author: book.author,
        cover_url: book.coverUrl ?? null,
        created_at: new Date().toISOString(),
      };
      setBooks((prev) => [optimistic, ...prev]);

      try {
        const saved = await addFavorite(payload);
        setBooks((prev) => [saved, ...prev.filter((b) => b.id !== optimistic.id)]);
      } catch {
        setBooks((prev) => prev.filter((b) => b.id !== optimistic.id));
      }
    },
    [byKey, refresh]
  );

  return { books, loading, isSaved, toggle, refresh };
}
