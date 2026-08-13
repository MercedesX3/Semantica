"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Star, MessageSquare, BookOpen, Check } from "lucide-react";
import AppShell from "@/components/AppShell";
import GenreTag from "@/components/ui/GenreTag";
import { useShelf } from "@/hooks/useShelf";
import {
  getBookDNA,
  getBookInfo,
  getRelatedBooks,
  normalizeWorkKey,
  BookDNA,
  BookDetails,
  ExternalBookResult,
} from "@/lib/api";

type Tab = "reviews" | "similar";

/**
 * Sentiment arc, pacing and themes for an analysed book.
 *
 * This only renders when real DNA exists. It previously fell back to a
 * hardcoded arc and a 35% pacing bar, so every un-analysed book displayed an
 * invented emotional profile as if it were measured.
 */
function EmotionalDNA({ dna }: { dna: BookDNA }) {
  const W = 500;
  const H = 96;
  const mid = H * 0.55;

  const points = useMemo(() => {
    const series = dna.arc.sentiment_series;
    if (series.length === 0) return "";
    return series
      .map((value, i) => {
        const x = series.length > 1 ? (i / (series.length - 1)) * W : W / 2;
        // sentiment runs -1..1; map onto the plot height
        const y = H - ((value + 1) / 2) * H;
        return `${x},${y}`;
      })
      .join(" ");
  }, [dna]);

  const pacing = Math.round(dna.style_profile.avg_pacing * 100);
  const pacingLabel = pacing >= 70 ? "FAST" : pacing >= 40 ? "MODERATE" : "SLOW-BURN";
  const themes = dna.theme_profile.top.map((t) => t.theme);

  return (
    <div className="bg-stone-50 pop-lg edge-thin p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-base font-semibold font-sans">Emotional DNA</span>
        <span className="text-xs font-medium font-mono text-zinc-500 uppercase tracking-wide">
          {dna.emotion_profile.arc_label}
        </span>
      </div>

      <div className="relative w-full" style={{ height: H }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Sentiment arc: ${dna.emotion_profile.beginning_emotion} at the start, ${dna.emotion_profile.middle_emotion} in the middle, ${dna.emotion_profile.end_emotion} by the end.`}
        >
          <line x1="0" y1={mid} x2={W} y2={mid} stroke="#a3a3a3" strokeWidth="2.5" strokeDasharray="9 5" />
          <polyline
            points={points}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="3.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex justify-between text-xs font-bold font-mono">
        <span>BEGINNING</span>
        <span>END</span>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-sm font-semibold font-mono shrink-0">PACING</span>
        <div className="flex-1 h-7 rounded-sm edge-thin flex overflow-hidden">
          <div className="bg-brand h-full" style={{ width: `${Math.max(0, Math.min(100, pacing))}%` }} />
          <div className="bg-white flex-1 h-full" />
        </div>
        <span className="text-sm font-semibold font-mono shrink-0">{pacingLabel}</span>
      </div>

      {themes.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {themes.map((theme) => (
            <span
              key={theme}
              className="h-8 px-4 bg-white rounded-md edge pop text-sm font-semibold font-mono inline-flex items-center"
            >
              {theme}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isSaved, toggle } = useShelf();

  const [book, setBook] = useState<BookDetails | null>(null);
  const [dna, setDna] = useState<BookDNA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("similar");
  const [related, setRelated] = useState<ExternalBookResult[] | null>(null);

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
          try {
            const dnaData = await getBookDNA(numericId);
            if (!cancelled) setDna(dnaData);
          } catch {
            if (!cancelled) setDna(null);
          }
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

    void loadBook();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Related books, once we know the subject to search on.
  useEffect(() => {
    if (!book?.genre) {
      setRelated([]);
      return;
    }
    let cancelled = false;
    getRelatedBooks(book.genre, book.openLibraryKey ?? String(book.id), 8)
      .then((results) => {
        if (!cancelled) setRelated(results);
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [book]);

  const shelfKey = book?.openLibraryKey ?? (book ? `/works/${book.id}` : null);
  const saved = isSaved(shelfKey);

  function toggleShelf() {
    if (!book || !shelfKey) return;
    void toggle({
      key: shelfKey,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
    });
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center py-24">
          <p className="text-lg font-semibold font-sans text-zinc-500">Loading book…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !book) {
    return (
      <AppShell>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
          <p className="text-2xl font-bold font-sans">We couldn&apos;t load this book</p>
          <p className="text-base font-semibold font-sans text-zinc-500 max-w-md">
            {error ?? "Unknown error"}
          </p>
          <Link
            href="/home"
            className="mt-2 h-11 px-6 rounded-lg bg-brand text-white edge pop press inline-flex items-center text-base font-semibold font-sans"
          >
            Back to Browse
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell fixedHeight>
      <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
        {/* ── Book ─────────────────────────────────────────── */}
        <div className="w-full lg:w-1/2 shrink-0 bg-amber-300 lg:overflow-y-auto border-b-2 lg:border-b-0 border-black">
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
              {book.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverUrl}
                  alt={`Cover of ${book.title}`}
                  className="w-36 h-54 sm:w-44 sm:h-64 object-cover shrink-0 pop border-2 border-black"
                />
              ) : (
                <div className="w-36 h-54 sm:w-44 sm:h-64 shrink-0 bg-amber-200 pop border-2 border-black flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-amber-800/50" aria-hidden />
                </div>
              )}

              <div className="flex flex-col gap-3 min-w-0 flex-1">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium font-serif italic leading-tight text-balance">
                  {book.title}
                </h1>

                <p className="text-base font-bold font-sans">{book.author}</p>

                {book.rating != null && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Star className="w-5 h-5 fill-black text-black" strokeWidth={1.5} aria-hidden />
                    <span className="text-base font-bold font-sans">{book.rating.toFixed(2)}</span>
                    {book.ratings != null && (
                      <span className="text-base font-semibold font-sans text-amber-900">
                        {book.ratings.toLocaleString()} ratings
                      </span>
                    )}
                  </div>
                )}

                {book.genre && <GenreTag genre={book.genre} size="sm" className="self-start" />}

                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={toggleShelf}
                    aria-pressed={saved}
                    className={`h-11 px-6 rounded-lg edge pop press inline-flex items-center gap-2 text-base font-semibold font-sans cursor-pointer ${
                      saved ? "bg-white text-black" : "bg-brand text-white"
                    }`}
                  >
                    {saved && <Check className="w-4 h-4" strokeWidth={3} aria-hidden />}
                    {saved ? "On your shelf" : "Want to read"}
                  </button>

                  <button
                    type="button"
                    onClick={toggleShelf}
                    aria-pressed={saved}
                    aria-label={saved ? "Remove from your shelf" : "Save to your shelf"}
                    className="w-11 h-11 rounded-lg bg-white edge pop press flex items-center justify-center cursor-pointer"
                  >
                    <Heart
                      className={`w-5 h-5 ${saved ? "text-brand-strong" : "text-black"}`}
                      fill={saved ? "currentColor" : "none"}
                      strokeWidth={2}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-sans text-amber-900 mb-3">
                Description
              </h2>
              <p className="text-base font-semibold font-sans leading-relaxed text-amber-950 whitespace-pre-line">
                {book.description ?? "No description available for this book yet."}
              </p>
            </div>

            {dna ? (
              <EmotionalDNA dna={dna} />
            ) : (
              <div className="bg-stone-50 edge-thin pop p-5 flex flex-col gap-2">
                <p className="text-base font-semibold font-sans">Emotional DNA not available yet</p>
                <p className="text-sm font-semibold font-sans text-zinc-600 leading-relaxed">
                  Sentiment arc, pacing, and themes are measured from the book&apos;s
                  full text. This title hasn&apos;t been ingested and analysed by
                  Semantica yet, so there&apos;s nothing to show — rather than a
                  guess.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col lg:overflow-hidden lg:border-l-2 border-black">
          <div
            role="tablist"
            aria-label="More about this book"
            className="px-6 sm:px-8 py-4 flex items-center gap-6 border-b-2 border-black/10 shrink-0"
          >
            {(
              [
                ["similar", "Similar books"],
                ["reviews", "Reviews"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={`text-base font-bold font-sans cursor-pointer ${
                  tab === value
                    ? "underline decoration-2 underline-offset-4 decoration-brand"
                    : "text-zinc-500 hover:text-black transition-colors"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 lg:overflow-y-auto px-6 sm:px-8 py-6">
            {tab === "similar" ? (
              related === null ? (
                <p className="text-base font-semibold font-sans text-zinc-500">
                  Finding books like this one…
                </p>
              ) : related.length === 0 ? (
                <p className="text-base font-semibold font-sans text-zinc-600 max-w-md">
                  We don&apos;t have enough subject data on this title to suggest
                  neighbours yet.
                </p>
              ) : (
                <>
                  <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4">
                    Shares the subject “{book.genre}”
                  </p>
                  <ul className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    {related.map((item) => (
                      <li key={item.key}>
                        <button
                          type="button"
                          onClick={() => router.push(`/books/${normalizeWorkKey(item.key)}`)}
                          className="text-left w-full group cursor-pointer"
                        >
                          {item.cover_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.cover_url}
                              alt=""
                              loading="lazy"
                              className="w-full aspect-[2/3] object-cover pop border-2 border-black transition-transform group-hover:-translate-y-1"
                            />
                          ) : (
                            <div className="w-full aspect-[2/3] bg-zinc-200 pop border-2 border-black flex items-center justify-center">
                              <BookOpen className="w-7 h-7 text-zinc-400" aria-hidden />
                            </div>
                          )}
                          <p className="mt-3 text-sm font-bold font-sans leading-tight line-clamp-2">
                            {item.title}
                          </p>
                          <p className="text-xs font-semibold font-sans text-zinc-600 truncate">
                            {item.author}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )
            ) : (
              <div className="max-w-md flex flex-col gap-4">
                <span className="w-12 h-12 rounded-lg bg-brand-soft edge pop-sm inline-flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-black" aria-hidden />
                </span>
                <h3 className="text-xl font-bold font-sans">No reviews yet</h3>
                <p className="text-base font-semibold font-sans text-zinc-600 leading-relaxed">
                  Reader reviews are coming to Semantica. Until then, save the book
                  to your shelf — what you save is what sharpens your matches.
                </p>
                <button
                  type="button"
                  onClick={toggleShelf}
                  className="self-start h-11 px-6 rounded-lg bg-white text-black edge pop press inline-flex items-center text-base font-semibold font-sans cursor-pointer"
                >
                  {saved ? "Remove from shelf" : "Save to shelf"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
