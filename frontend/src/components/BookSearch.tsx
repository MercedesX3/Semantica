"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Loader2 } from "lucide-react";
import { searchOpenLibrary, normalizeWorkKey, ExternalBookResult } from "@/lib/api";

interface BookSearchProps {
  placeholder?: string;
  /** Class applied to the input's bordered container. */
  containerClassName?: string;
  className?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
}

/**
 * Debounced book search with a results dropdown.
 *
 * This replaces four near-identical copies of the same debounce + fetch +
 * dropdown logic that had drifted apart across the nav, the landing hero,
 * the book detail page and onboarding.
 */
export default function BookSearch({
  placeholder = "Search for a book",
  containerClassName = "",
  className = "",
  autoFocus = false,
  onNavigate,
}: BookSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExternalBookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setFailed(false);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setOpen(true);
      searchOpenLibrary(trimmed, 8)
        .then((data) => {
          if (cancelled) return;
          setResults(data);
          setFailed(false);
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
          setFailed(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function goToBook(book: ExternalBookResult) {
    setOpen(false);
    setQuery("");
    setResults([]);
    onNavigate?.();
    router.push(`/books/${normalizeWorkKey(book.key)}`);
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className={`h-11 px-4 bg-white rounded-lg edge pop flex items-center gap-2.5 ${containerClassName}`}
      >
        <Search className="w-5 h-5 shrink-0 text-black" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              e.preventDefault();
              goToBook(results[0]);
            }
          }}
          placeholder={placeholder}
          aria-label="Search for a book"
          className={`bg-transparent outline-none text-base font-semibold font-sans placeholder:text-black/40 flex-1 min-w-0 ${className}`}
        />
        {loading && <Loader2 className="w-4 h-4 shrink-0 animate-spin text-brand" aria-hidden />}
      </div>

      {open && query.trim().length >= 2 && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-lg border-2 border-black bg-white pop z-40 text-left"
        >
          {loading && results.length === 0 ? (
            <p className="px-4 py-3 text-sm font-semibold font-sans text-zinc-500">Searching…</p>
          ) : results.length > 0 ? (
            <ul className="divide-y-2 divide-black/10">
              {results.map((book) => (
                <li key={book.key}>
                  <button
                    type="button"
                    onClick={() => goToBook(book)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-brand-soft/30 transition-colors cursor-pointer"
                  >
                    {book.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.cover_url}
                        alt=""
                        loading="lazy"
                        className="h-14 w-10 object-cover shrink-0 border-2 border-black"
                      />
                    ) : (
                      <div className="h-14 w-10 shrink-0 border-2 border-black bg-stone-100 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-zinc-400" aria-hidden />
                      </div>
                    )}
                    <span className="min-w-0 flex flex-col gap-0.5">
                      <span className="block text-sm font-bold font-sans truncate">{book.title}</span>
                      <span className="block text-xs font-semibold font-sans text-zinc-600 truncate">
                        {book.author}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm font-semibold font-sans text-zinc-500">
              {failed
                ? "Search is unavailable right now. Please try again."
                : `No books found for “${query.trim()}”.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
