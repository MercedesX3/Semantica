"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Dna, Info, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import BookCard, { BookData } from "@/components/ui/BookCard";
import { useShelf } from "@/hooks/useShelf";
import { readTasteProfile, TasteProfile } from "@/lib/taste";
import { readCachedUser } from "@/lib/session";
import {
  getAnalysedBooks,
  getForYouRecommendations,
  getPicksByGenres,
  getTrendingBooks,
  normalizeWorkKey,
  AnalysedBook,
  ForYouBook,
} from "@/lib/api";

/** Swatches used for the Reading DNA orbs, cycled over the reader's own genres. */
const DNA_COLORS = [
  "bg-pink-300",
  "bg-amber-400",
  "bg-sky-500",
  "bg-emerald-300",
  "bg-blue-700",
  "bg-violet-500",
  "bg-orange-400",
];

type RailState =
  | { status: "loading" }
  | { status: "ready"; books: BookData[] }
  | { status: "empty" }
  | { status: "error" };

function ReadingDnaOrb({
  label,
  color,
  active,
  onHover,
}: {
  label: string;
  color: string;
  active: boolean;
  onHover: (label: string | null) => void;
}) {
  return (
    <div
      className="relative flex flex-col items-center gap-2"
      onMouseEnter={() => onHover(label)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className={`w-16 h-16 sm:w-20 sm:h-20 ${color} rounded-full edge flex items-center justify-center transition-all duration-200 ease-out ${
          active ? "scale-110 pop-lg" : "pop-sm"
        }`}
        aria-hidden
      >
        <div
          className={`bg-white rounded-full transition-all duration-200 ${
            active ? "w-5 h-5" : "w-4 h-4"
          }`}
        />
      </div>
      <span
        className={`text-sm font-semibold font-sans transition-colors ${
          active ? "text-brand-strong" : "text-black"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function BookRail({
  state,
  emptyMessage,
  errorMessage,
  showSaveButton,
  isSaved,
  onToggleSave,
  onOpen,
}: {
  state: RailState;
  emptyMessage: string;
  errorMessage: string;
  showSaveButton?: boolean;
  isSaved: (key?: string | null) => boolean;
  onToggleSave: (book: BookData) => void;
  onOpen: (book: BookData) => void;
}) {
  if (state.status === "loading") {
    return (
      <div className="flex gap-6 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="w-40 sm:w-48 lg:w-52 shrink-0 animate-pulse">
            <div className="w-full aspect-[2/3] bg-zinc-200 border-2 border-black pop" />
            <div className="h-4 bg-zinc-200 rounded mt-4 w-3/4" />
            <div className="h-3 bg-zinc-200 rounded mt-2 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (state.status !== "ready") {
    return (
      <p className="text-base font-semibold text-zinc-500 max-w-lg">
        {state.status === "empty" ? emptyMessage : errorMessage}
      </p>
    );
  }

  return (
    <div className="flex gap-5 sm:gap-6 overflow-x-auto rail pb-2 items-start">
      {state.books.map((book) => (
        <div key={book.id} className="shrink-0">
          <BookCard
            book={book}
            size="lg"
            showSave={showSaveButton}
            saved={isSaved(book.openLibraryKey)}
            onSave={() => onToggleSave(book)}
            showHeart={Boolean(book.openLibraryKey)}
            favorited={isSaved(book.openLibraryKey)}
            onFavorite={() => onToggleSave(book)}
            onClick={() => onOpen(book)}
          />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { books: shelf, loading: shelfLoading, isSaved, toggle } = useShelf();

  const [hoveredDna, setHoveredDna] = useState<string | null>(null);
  const [taste, setTaste] = useState<TasteProfile | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [picks, setPicks] = useState<RailState>({ status: "loading" });
  const [picksFromTaste, setPicksFromTaste] = useState(false);
  const [trending, setTrending] = useState<RailState>({ status: "loading" });
  const [analysed, setAnalysed] = useState<AnalysedBook[]>([]);
  const [dnaInfoOpen, setDnaInfoOpen] = useState(false);

  useEffect(() => {
    setTaste(readTasteProfile());
    setFirstName(readCachedUser()?.first_name ?? null);
  }, []);

  // Books Semantica has actually read — the only ones with a real DNA profile.
  useEffect(() => {
    let cancelled = false;
    getAnalysedBooks()
      .then((books) => {
        if (!cancelled) setAnalysed(books);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    function toBookData(recs: ForYouBook[]) {
      return recs.map((r, i) => ({
        id: r.key ? normalizeWorkKey(r.key) : `pick-${i}`,
        title: r.title,
        author: r.author,
        genre: r.genre ?? undefined,
        coverUrl: r.cover_url,
        openLibraryKey: r.key,
      }));
    }

    // Prefer the embedding-based recommender; fall back to the reader's own
    // onboarding genres so Browse still has something real to show when the
    // recommender isn't reachable.
    async function loadPicks() {
      let recs: ForYouBook[] = [];
      let usedFallback = false;

      try {
        recs = await getForYouRecommendations(10);
      } catch {
        recs = [];
      }

      if (recs.length === 0) {
        const genres = readTasteProfile()?.genres ?? [];
        if (genres.length > 0) {
          recs = await getPicksByGenres(genres, 10);
          usedFallback = recs.length > 0;
        }
      }

      if (cancelled) return;
      setPicksFromTaste(usedFallback);
      setPicks(recs.length > 0 ? { status: "ready", books: toBookData(recs) } : { status: "empty" });
    }

    void loadPicks();

    getTrendingBooks()
      .then((data) => {
        if (cancelled) return;
        const combined = [...data.nytimes, ...data.open_library];
        if (combined.length === 0) {
          setTrending({ status: "empty" });
          return;
        }
        setTrending({
          status: "ready",
          books: combined.map((book, i) => ({
            id: book.source_id ?? `${book.source}-${book.source_rank}-${i}`,
            title: book.title,
            author: book.author,
            coverUrl: book.cover_url ?? undefined,
            openLibraryKey: book.source === "open_library" ? book.source_id : undefined,
          })),
        });
      })
      .catch(() => {
        if (!cancelled) setTrending({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function openBook(book: BookData) {
    const ref = book.openLibraryKey ? normalizeWorkKey(book.openLibraryKey) : String(book.id);
    router.push(`/books/${ref}`);
  }

  function toggleSave(book: BookData) {
    if (!book.openLibraryKey) return;
    void toggle({
      key: book.openLibraryKey,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
    });
  }

  const dnaGenres = taste?.genres ?? [];

  return (
    <AppShell>
      <div className="flex flex-1 flex-col xl:flex-row min-h-0">
        <main className="flex-1 min-w-0 px-5 sm:px-8 lg:px-12 py-8 lg:py-12 xl:overflow-y-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-sans tracking-tight mb-8 lg:mb-10">
            {firstName ? `Discover your next read, ${firstName}` : "Discover your next read"}
          </h1>

          {/* ── Reading DNA ─────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-sans mb-5">Your Reading DNA</h2>

            {dnaGenres.length > 0 ? (
              <div className="flex items-start gap-6 sm:gap-8 flex-wrap">
                {dnaGenres.map((label, i) => (
                  <ReadingDnaOrb
                    key={label}
                    label={label}
                    color={DNA_COLORS[i % DNA_COLORS.length]}
                    active={hoveredDna === label}
                    onHover={setHoveredDna}
                  />
                ))}
              </div>
            ) : (
              <div className="max-w-lg bg-stone-50 edge pop p-6 flex flex-col gap-3">
                <span className="w-11 h-11 rounded-lg bg-brand-soft edge pop-sm inline-flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-black" aria-hidden />
                </span>
                <p className="text-base font-semibold text-zinc-700 leading-relaxed">
                  Answer six quick questions and your Reading DNA — the genres,
                  moods, and feelings you actually read for — shows up here.
                </p>
                <Link
                  href="/onboarding"
                  className="self-start h-11 px-6 rounded-lg bg-brand text-white edge pop press inline-flex items-center text-base font-semibold font-sans"
                >
                  Build my reading profile
                </Link>
              </div>
            )}
          </section>

          {/* ── Picks ───────────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-sans mb-2">Picks for you</h2>
            <p className="text-sm font-mono uppercase tracking-wider text-zinc-500 mb-4">
              {picksFromTaste
                ? `Because you read ${(taste?.genres ?? []).slice(0, 3).join(", ")}`
                : "Matched to your reading profile"}
            </p>
            <BookRail
              state={picks}
              showSaveButton
              emptyMessage="No picks yet — build your reading profile or save a few books you love, and we'll start matching against them."
              errorMessage="We couldn't load your picks just now. Refresh to try again."
              isSaved={isSaved}
              onToggleSave={toggleSave}
              onOpen={openBook}
            />
          </section>

          {/* ── Trending ────────────────────────────────────── */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold font-sans mb-5">Trending now</h2>
            <BookRail
              state={trending}
              emptyMessage="Nothing trending right now — check back tomorrow."
              errorMessage="We couldn't load trending books just now. Refresh to try again."
              isSaved={isSaved}
              onToggleSave={toggleSave}
              onOpen={openBook}
            />
          </section>
        </main>

        {/* ── Shelf sidebar ─────────────────────────────────── */}
        <aside className="xl:w-80 shrink-0 px-5 sm:px-8 xl:px-8 py-8 xl:py-12 xl:overflow-y-auto border-t-2 xl:border-t-0 xl:border-l-2 border-black/10">
          <div className="flex items-baseline justify-between gap-3 mb-5">
            <h2 className="text-xl sm:text-2xl font-bold font-sans">On your shelf</h2>
            {shelf.length > 0 && (
              <Link
                href="/library"
                className="text-sm font-semibold font-sans underline decoration-2 underline-offset-4 decoration-brand shrink-0"
              >
                See all
              </Link>
            )}
          </div>

          {shelfLoading ? (
            <p className="text-sm font-semibold text-zinc-500">Loading…</p>
          ) : shelf.length === 0 ? (
            <p className="text-sm font-semibold text-zinc-600 leading-relaxed max-w-sm">
              Nothing saved yet. Tap the heart on any book and it&apos;ll wait for you here.
            </p>
          ) : (
            <ul className="flex xl:flex-col gap-5 overflow-x-auto rail pb-2 xl:pb-0">
              {shelf.slice(0, 8).map((book) => (
                <li key={book.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => router.push(`/books/${normalizeWorkKey(book.open_library_key)}`)}
                    className="flex items-center gap-4 text-left cursor-pointer group w-64 xl:w-full"
                  >
                    {book.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.cover_url}
                        alt=""
                        loading="lazy"
                        className="w-14 h-21 object-cover shrink-0 pop border-2 border-black transition-transform group-hover:-translate-y-0.5"
                      />
                    ) : (
                      <div className="w-14 h-21 shrink-0 bg-zinc-200 pop border-2 border-black" />
                    )}
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="block text-base font-bold font-sans leading-tight line-clamp-2">
                        {book.title}
                      </span>
                      <span className="block text-sm font-semibold font-sans text-zinc-600 truncate">
                        {book.author}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* ── Books with real DNA ─────────────────────────── */}
          <section className="mt-10 pt-8 border-t-2 border-black/10">
            <div className="flex items-start gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-sans">Want to check out book DNA?</h2>
              <button
                type="button"
                onClick={() => setDnaInfoOpen(true)}
                aria-label="How book DNA is calculated"
                className="mt-1 shrink-0 cursor-pointer text-zinc-500 transition-colors hover:text-brand-strong"
              >
                <Info className="w-4.5 h-4.5" aria-hidden />
              </button>
            </div>
            <p className="mt-1.5 mb-5 text-sm font-semibold text-zinc-600 leading-relaxed">
              {analysed.length > 0
                ? "Semantica has read these end to end — open one to see its sentiment arc, pacing, and themes."
                : "No books have been analysed yet. Open any book and upload its PDF to build the first profile."}
            </p>

            {analysed.length > 0 && (
              <ul className="flex xl:flex-col gap-3 overflow-x-auto rail pb-2 xl:pb-0">
                {analysed.map((book) => (
                  <li key={book.id} className="shrink-0 w-64 xl:w-full">
                    <button
                      type="button"
                      onClick={() => router.push(`/books/${book.id}`)}
                      className="w-full flex items-center gap-3 bg-stone-50 edge pop-sm press rounded-md p-3 text-left cursor-pointer"
                    >
                      <Dna className="w-4 h-4 shrink-0 text-brand-strong" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold font-sans truncate">
                          {book.title}
                        </span>
                        <span className="block text-xs font-semibold font-sans text-zinc-600 truncate">
                          {book.author}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-wider text-zinc-500">
                        {book.arcLabel}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {dnaInfoOpen && <DnaInfoDialog onClose={() => setDnaInfoOpen(false)} />}
    </AppShell>
  );
}

const DNA_STEPS = [
  {
    title: "Split into passages",
    body: "The full text is cut into overlapping chunks of roughly 400 words, kept aligned to chapter boundaries so a passage never straddles two scenes.",
  },
  {
    title: "Score every passage",
    body: "Each chunk is classified for emotion, intensity, pacing, and dialogue density. Pacing comes from sentence length and dialogue share; sentiment runs from \u22121 to +1.",
  },
  {
    title: "Pull out themes",
    body: "A zero-shot classifier tests each chapter against a set of candidate themes and keeps the ones it is most confident about — that's where “grief” or “found family” comes from.",
  },
  {
    title: "Fold it into one profile",
    body: "The per-passage scores are aggregated into the arc you see: sentiment sampled across the book, an average pacing value, the dominant emotion at the start, middle, and end, and the top themes.",
  },
];

/** Explains where the numbers on the Emotional DNA panel come from. */
function DnaInfoDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dna-info-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-stone-50 edge pop-lg rounded-lg p-6 sm:p-8 flex flex-col gap-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brand-strong mb-1">
              How it works
            </p>
            <h2 id="dna-info-title" className="text-2xl font-bold font-sans tracking-tight">
              How book DNA is calculated
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md bg-white edge pop-sm press cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={3} aria-hidden />
          </button>
        </div>

        <p className="text-sm font-semibold text-zinc-600 leading-relaxed">
          Every figure on the Emotional DNA panel is measured from the book&apos;s
          own text. Nothing is taken from a blurb, a genre label, or a rating.
        </p>

        <ol className="flex flex-col gap-4">
          {DNA_STEPS.map(({ title, body }, i) => (
            <li key={title} className="flex gap-3">
              <span className="shrink-0 mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand text-white edge-thin font-mono text-xs font-bold">
                {i + 1}
              </span>
              <span>
                <span className="block font-sans font-bold text-base leading-tight">{title}</span>
                <span className="block mt-1 text-sm font-semibold text-zinc-600 leading-relaxed">
                  {body}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <p className="text-xs font-semibold text-zinc-500 leading-relaxed border-t-2 border-black/10 pt-4">
          A book only gets a profile once its full text has been ingested and
          analysed — which is why most titles show an upload prompt instead of a
          chart.
        </p>
      </div>
    </div>
  );
}
