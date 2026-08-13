"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Star, MessageSquare, BookOpen, Check } from "lucide-react";
import AppShell from "@/components/AppShell";
import GenreTag from "@/components/ui/GenreTag";
import EmotionalDnaCard from "@/components/EmotionalDnaCard";
import { useShelf } from "@/hooks/useShelf";
import {
  findLocalBook,
  getBookDNA,
  getBookInfo,
  getRelatedBooks,
  normalizeWorkKey,
  BookDNA,
  BookDetails,
  ExternalBookResult,
} from "@/lib/api";

type Tab = "reviews" | "similar";

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
  /** Our own book id, when this title has been ingested locally. */
  const [, setLocalBookId] = useState<number | null>(null);

  const handleAnalysed = useCallback((bookId: number, fresh: BookDNA) => {
    setLocalBookId(bookId);
    setDna(fresh);
  }, []);

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

        // DNA is keyed by our own numeric book id. A page reached by Open
        // Library key still has DNA if the same title has been ingested, so
        // fall back to a title match rather than assuming there's none.
        const numericId = Number(bookData.id);
        const localId =
          Number.isInteger(numericId) && bookData.source === "database"
            ? numericId
            : (await findLocalBook(bookData.title))?.id ?? null;

        if (cancelled) return;
        setLocalBookId(localId);

        if (localId == null) {
          setDna(null);
          return;
        }

        try {
          const dnaData = await getBookDNA(localId);
          if (!cancelled) setDna(dnaData);
        } catch {
          if (!cancelled) setDna(null);
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

            <EmotionalDnaCard
              dna={dna}
              bookTitle={book.title}
              bookAuthor={book.author}
              onAnalysed={handleAnalysed}
            />
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
