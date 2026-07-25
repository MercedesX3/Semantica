"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X, BookOpen } from "lucide-react";
import Logo from "./Logo";
import { searchOpenLibrary, ExternalBookResult } from "@/lib/api";
import { useRouter } from "next/navigation";

const NAV_LINKS = [
  { label: "Browse", href: "/home" },
  { label: "Book Scroll", href: "/scroll" },
  { label: "Map", href: "/map" },
  { label: "Library", href: "/library" },
  { label: "Soundtracks", href: "/soundtracks" },
];

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExternalBookResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearchLoading(true);
      searchOpenLibrary(trimmed, 8)
        .then((results) => {
          if (!cancelled) {
            setSearchResults(results);
            setSearchOpen(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSearchResults([]);
          }
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSearchOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="w-full bg-stone-50 outline-2 -outline-offset-2 outline-black p-2.5 flex items-center justify-between shrink-0">

      {/* Logo */}
      <Link href="/home" aria-label="Home">
        <Logo size={32} />
      </Link>

      {/* Right group */}
      <div className="flex items-center gap-8">

        {/* Nav links — collapse when search is open */}
        <nav
          className="flex items-center gap-8 overflow-hidden"
          style={{
            maxWidth: searchOpen ? 0 : 600,
            opacity: searchOpen ? 0 : 1,
            pointerEvents: searchOpen ? "none" : "auto",
          }}
        >
          {NAV_LINKS.map(({ label, href }) => {
            const base = href.split("#")[0];
            const active = pathname === base || (base !== "/home" && pathname.startsWith(base + "/"));
            return (
              <Link
                key={label}
                href={href}
                className={`text-lg font-semibold font-sans text-black whitespace-nowrap ${active ? "underline decoration-2 underline-offset-4" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Expanding search input */}
        <div
          className="overflow-visible"
          style={{
            width: searchOpen ? 280 : 0,
            opacity: searchOpen ? 1 : 0,
            pointerEvents: searchOpen ? "auto" : "none",
          }}
        >
          <div className="relative w-70">
            <div className="flex items-center gap-2 bg-white outline-2 -outline-offset-2 outline-black px-3 h-9 w-70">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 2 && setSearchOpen(true)}
                placeholder="Search books..."
                className="bg-transparent outline-none text-base font-semibold font-sans placeholder:text-black/40 flex-1 min-w-0"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                aria-label="Close search"
                className="shrink-0 text-black/40 hover:text-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {searchOpen && (searchQuery.trim().length >= 2 || searchResults.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 max-h-72 overflow-y-auto rounded-lg border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-30">
                {searchLoading ? (
                  <p className="px-3 py-3 text-sm font-semibold font-sans text-zinc-500">Searching…</p>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-zinc-100">
                    {searchResults.map((book) => (
                      <button
                        key={book.key}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                          setSearchResults([]);
                          const bookRef = book.key.split("/").filter(Boolean).pop() ?? book.key;
                          router.push(`/books/${bookRef}`);
                        }}
                        className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-zinc-50"
                      >
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="h-14 w-10 object-cover shrink-0 border border-black rounded-sm" />
                        ) : (
                          <div className="h-14 w-10 shrink-0 border border-black bg-stone-100 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-zinc-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex flex-col gap-0.5">
                          <p className="text-sm font-bold font-sans truncate">{book.title}</p>
                          <p className="text-xs font-semibold font-sans text-zinc-600 truncate">{book.author}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-3 text-sm font-semibold font-sans text-zinc-500">No books found</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search icon toggle */}
        <button
          type="button"
          aria-label={searchOpen ? "Close search" : "Open search"}
          onClick={() => {
            setSearchOpen((v) => !v);
            if (!searchOpen) {
              setSearchQuery("");
              setSearchResults([]);
            }
          }}
          className={`p-1 transition-colors duration-200 cursor-pointer ${searchOpen ? "text-pink-500" : "text-black"}`}
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Profile */}
        <Link
          href="/profile"
          className="p-1 bg-pink-400 rounded-sm inline-flex items-center justify-center"
          aria-label="Profile"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="2" width="14" height="18" rx="1" stroke="white" strokeWidth="2" />
            <circle cx="10" cy="8" r="2.5" stroke="white" strokeWidth="1.5" />
            <path d="M5.5 18c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Link>

      </div>
    </header>
  );
}
