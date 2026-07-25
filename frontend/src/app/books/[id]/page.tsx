"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Heart, Star, ChevronDown, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import Btn from "@/components/ui/Btn";
import { getBookDNA, BookDNA, getBookInfo, BookDetails, searchOpenLibrary, ExternalBookResult } from "@/lib/api";

const DUMMY_REVIEWS = Array.from({ length: 5 }, () => ({
  name: "Firstname",
  reviewCount: 2143,
  followers: 175,
  text: "2024: Each time I read what PBS dubs the perfect American novel, my heart fills just a little more. There are few books where the beginning paragraphs hit a home run for me, and this is one of them. It has been a long month filled with family time and endless cooking so for the last ten days I",
}));

/* Sentiment arc — peaks go well above midline, valleys dip below */
const SENTIMENT_PTS = [
  [0, 48], [10, 82], [22, 38], [35, 88], [48, 30],
  [60, 80], [72, 42], [85, 90], [100, 58],
];

function EmotionalDNA({
  pacing,
  themes,
  sentimentPoints = SENTIMENT_PTS,
  pacingLabel = "SLOW-BURN",
}: {
  pacing: number;
  themes: string[];
  sentimentPoints?: number[][];
  pacingLabel?: string;
}) {
  const W = 500, H = 96;
  const mid = H * 0.55;
  const pts = sentimentPoints.map(([x, y]) => `${(x / 100) * W},${H - (y / 100) * H}`).join(" ");

  return (
    <div className="bg-stone-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] outline-1 -outline-offset-1 outline-black p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold font-sans">Emotional DNA</span>
        <div className="flex items-center gap-2 text-xs font-medium font-mono text-zinc-500">
          <span>SENTIMENT ARC</span>
          <div className="w-1 h-1 bg-black rounded-full" />
          <span>PACING</span>
          <div className="w-1 h-1 bg-black rounded-full" />
          <span>THEMES</span>
        </div>
      </div>

      <div className="relative w-full" style={{ height: H }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1={mid} x2={W} y2={mid} stroke="#a3a3a3" strokeWidth="2.5" strokeDasharray="9 5" />
          <polyline
            points={pts}
            fill="none"
            stroke="#ec4899"
            strokeWidth="3.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <div
          className="absolute pointer-events-none"
          style={{ left: 12, right: 12, top: Math.round(mid - 4), height: 64 }}
        />
      </div>

      <div className="flex justify-between text-xs font-bold font-mono">
        <span>BEGINNING</span>
        <span>END</span>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-sm font-semibold font-mono shrink-0">PACING</span>
        <div className="flex-1 h-7 rounded-sm outline-1 -outline-offset-1 outline-black flex overflow-hidden">
          <div className="bg-red-500 h-full" style={{ width: `${Math.max(0, Math.min(100, pacing))}%` }} />
          <div className="bg-white flex-1 h-full" />
        </div>
        <span className="text-sm font-semibold font-mono shrink-0">{pacingLabel}</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {themes.length === 0 ? (
          <span className="text-sm font-semibold font-mono text-zinc-400">No themes yet</span>
        ) : (
          themes.map((t) => (
            <span
              key={t}
              className="h-8 px-6 py-2 bg-white rounded-md outline-2 -outline-offset-2 outline-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm font-semibold font-mono inline-flex items-center"
            >
              {t}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function pacingLabelFromValue(pacing: number): string {
  if (pacing >= 70) return "FAST";
  if (pacing >= 40) return "MODERATE";
  return "SLOW-BURN";
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [book, setBook] = useState<BookDetails | null>(null);
  const [dna, setDna] = useState<BookDNA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExternalBookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Missing book id.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadBook() {
      try {
        setLoading(true);
        setError(null);

        const bookData = await getBookInfo(id);
        if (cancelled) return;
        setBook(bookData);

        // DNA only exists for ingested numeric book ids.
        const numericId = Number(bookData.id);
        if (Number.isInteger(numericId) && bookData.source === "database") {
          const dnaData = await getBookDNA(numericId);
          if (!cancelled) setDna(dnaData);
        } else {
          setDna(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load this book.");
          setBook(null);
          setDna(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBook();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
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
            setSearchOpen(false);
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const sentimentPoints = dna
    ? dna.arc.sentiment_series.map((v, i, arr) => [
        arr.length > 1 ? (i / (arr.length - 1)) * 100 : 50,
        ((v + 1) / 2) * 100,
      ])
    : undefined;

  const pacingValue = dna ? Math.round(dna.style_profile.avg_pacing * 100) : 35;
  const themeList =
    dna && dna.theme_profile.top.length > 0
      ? dna.theme_profile.top.map((t) => t.theme)
      : [];

  if (loading) {
    return (
      <AppShell fixedHeight>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-lg font-semibold font-sans text-zinc-500">Loading book…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !book) {
    return (
      <AppShell fixedHeight>
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-8">
          <p className="text-lg font-bold font-sans text-zinc-800">Couldn&apos;t load this book</p>
          <p className="text-sm font-semibold font-sans text-zinc-500">{error ?? "Unknown error"}</p>
        </div>
      </AppShell>
    );
  }

  async function findBook() {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    try {
      setSearching(true);
      const results = await searchOpenLibrary(trimmedQuery, 8);
      setSearchResults(results);
      setSearchOpen(true);
    } catch (err) {
      console.error("Search failed", err);
      setSearchResults([]);
      setSearchOpen(false);
    } finally {
      setSearching(false);
    }
  }

  return (
    <AppShell fixedHeight>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 shrink-0 bg-amber-300 overflow-y-auto">
          <div className="p-10 flex flex-col gap-8">
            <div className="flex gap-8 items-start">
              {book.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-44 h-64 object-cover shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black"
                />
              ) : (
                <div className="w-44 h-64 shrink-0 bg-amber-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black" />
              )}

              <div className="flex flex-col gap-3 pt-2 min-w-0 flex-1">
                <h1 className="text-5xl font-medium font-serif italic leading-tight">
                  {book.title}
                </h1>

                <p className="text-base font-bold font-sans">{book.author}</p>

                {book.rating != null && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-black" strokeWidth={1.5} />
                    <span className="text-base font-bold font-sans">{book.rating.toFixed(2)}</span>
                    {book.ratings != null && (
                      <span className="text-base font-semibold font-sans text-pink-500">
                        {book.ratings.toLocaleString()} Ratings
                      </span>
                    )}
                  </div>
                )}

                {book.genre && (
                  <span className="self-start px-4 py-1 rounded-md border border-black text-sm font-semibold font-sans">
                    {book.genre}
                  </span>
                )}

                <div className="flex items-center justify-between mt-1">
                  <Btn variant="primary" size="lg">Want to Read</Btn>
                  <button
                    className="w-11 h-11 rounded-lg border-2 border-pink-400 bg-white/50 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]"
                    aria-label="Favorite"
                  >
                    <Heart className="w-5 h-5 text-pink-400" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold font-sans text-amber-600 mb-3">Description</h2>
              <p className="text-base font-bold font-sans leading-relaxed text-amber-950">
                {book.description ?? "No description available for this book yet."}
              </p>
            </div>

            <EmotionalDNA
              pacing={pacingValue}
              themes={themeList}
              sentimentPoints={sentimentPoints}
              pacingLabel={pacingLabelFromValue(pacingValue)}
            />
            {!dna && (
              <p className="text-xs font-mono text-amber-800/70">
                Emotional DNA appears after a book is ingested and analyzed in Semantica.
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden border-l-2 border-black">
          <div className="px-8 py-5 flex items-center justify-end gap-8 border-black shrink-0">
            <button className="text-base font-bold font-sans underline decoration-2 underline-offset-4">
              REVIEWS
            </button>
            <button className="text-base font-bold font-sans">SIMILAR BOOKS</button>
            <button className="text-base font-bold font-sans">SHOP</button>
          </div>

          <div className="px-8 py-4 shrink-0">
            <div className="relative">
              <div className="h-11 px-4 bg-stone-50 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-2 -outline-offset-2 outline-black flex items-center gap-2.5">
                <Search className="w-5 h-5 shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length >= 2 && setSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void findBook();
                    }
                  }}
                  placeholder="Search..."
                  className="bg-transparent outline-none text-base font-semibold font-sans flex-1 placeholder:text-black/40"
                />
                <Btn variant="primary-sm" size="sm" onClick={() => void findBook()} disabled={searching}>
                  {searching ? "..." : "Search"}
                </Btn>
              </div>

              {searchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-20 max-h-72 overflow-y-auto rounded-lg border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {searching ? (
                    <p className="px-4 py-3 text-sm font-semibold font-sans text-zinc-500">Searching…</p>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y divide-zinc-100">
                      {searchResults.map((result) => (
                        <div key={result.key} className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50">
                          {result.cover_url ? (
                            <img
                              src={result.cover_url}
                              alt={result.title}
                              className="h-16 w-12 object-cover shrink-0 border border-black rounded-sm"
                            />
                          ) : (
                            <div className="h-16 w-12 shrink-0 border border-black bg-stone-100" />
                          )}
                          <div className="min-w-0 flex flex-col gap-0.5">
                            <p className="text-sm font-bold font-sans">{result.title}</p>
                            <p className="text-sm font-semibold font-sans text-zinc-600">{result.author}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-sm font-semibold font-sans text-zinc-500">
                      No books found for this search.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {DUMMY_REVIEWS.map((r, i) => (
              <div key={i} className="flex gap-5 px-8 py-6">
                <div className="flex flex-col items-center gap-1 shrink-0 w-24 text-center">
                  <div className="w-12 h-12 bg-black rounded-full mb-1" />
                  <p className="text-xs font-semibold font-mono">{r.name}</p>
                  <p className="text-xs font-medium font-mono text-zinc-400">{r.reviewCount.toLocaleString()} Reviews</p>
                  <p className="text-xs font-medium font-mono text-zinc-400">{r.followers}k Followers</p>
                  <Btn variant="primary" size="sm" className="mt-1.5 w-full">Follow</Btn>
                </div>
                <div className="flex-1 flex flex-col gap-1.5 pt-0.5">
                  <p className="text-sm font-semibold font-sans leading-relaxed text-zinc-700">
                    {r.text}
                  </p>
                  <button className="flex items-center gap-1 text-sm font-semibold font-sans self-start">
                    Show more <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
