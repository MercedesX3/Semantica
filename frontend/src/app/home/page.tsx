"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import BookCard, { BookData } from "@/components/ui/BookCard";
import GenreTag from "@/components/ui/GenreTag";
import { Star } from "lucide-react";
import { getForYouRecommendations, getTrendingBooks } from "@/lib/api";

const DNA_GENRES = [
  {
    label: "Romance",
    color: "bg-pink-300",
    blurb: "Heart-forward stories about connection, desire, and emotional payoff.",
  },
  {
    label: "Literary",
    color: "bg-amber-400",
    blurb: "Language-driven fiction with rich character interiority.",
  },
  {
    label: "Horror",
    color: "bg-sky-500",
    blurb: "Unease, dread, and the thrill of things that go bump.",
  },
  {
    label: "Classic",
    color: "bg-emerald-300",
    blurb: "Enduring works that shaped how we still read and write.",
  },
  {
    label: "Sci-Fi",
    color: "bg-blue-700",
    blurb: "Speculative worlds, future tech, and big what-if questions.",
  },
];

const PICKS: BookData[] = [
  { id: 1, title: "Atmosphere", author: "Taylor Jenkins Reid", genre: "Literary", rating: 4.89, reviews: 1209, coverUrl: null },
  { id: 2, title: "The Midnight Library", author: "Matt Haig", genre: "Fiction", rating: 4.53, reviews: 2345, coverUrl: "https://covers.openlibrary.org/b/id/10982982-M.jpg" },
  { id: 3, title: "Klara and the Sun", author: "Kazuo Ishiguro", genre: "Sci-Fi", rating: 4.22, reviews: 1567, coverUrl: "https://covers.openlibrary.org/b/id/12003856-M.jpg" },
  { id: 4, title: "Project Hail Mary", author: "Andy Weir", genre: "Science Fiction", rating: 4.65, reviews: 2879, coverUrl: "https://covers.openlibrary.org/b/id/12032488-M.jpg" },
  { id: 5, title: "The Night Circus", author: "Erin Morgenstern", genre: "Fantasy", rating: 4.71, reviews: 3241, coverUrl: "https://covers.openlibrary.org/b/id/8409688-M.jpg" },
];

const TRENDING_FALLBACK: BookData[] = [
  { id: 6, title: "Circe", author: "Madeline Miller", genre: "Fantasy", coverUrl: "https://covers.openlibrary.org/b/id/9255912-M.jpg" },
  { id: 7, title: "Where the Crawdads Sing", author: "Delia Owens", genre: "Literary", coverUrl: "https://covers.openlibrary.org/b/id/8459529-M.jpg" },
  { id: 8, title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", genre: "Romance", coverUrl: "https://covers.openlibrary.org/b/id/9256490-M.jpg" },
  { id: 9, title: "Brave New World", author: "Aldous Huxley", genre: "Dystopian", coverUrl: "https://covers.openlibrary.org/b/id/8739161-M.jpg" },
  { id: 10, title: "Crime and Punishment", author: "Fyodor Dostoevsky", genre: "Classic", coverUrl: "https://covers.openlibrary.org/b/id/8739150-M.jpg" },
];

const CURRENTLY_READING: BookData[] = [
  { id: 1, title: "Atmosphere", author: "Taylor Jenkins Reid", genre: "Literary", rating: 4.89, reviews: 1209, coverUrl: null },
  { id: 2, title: "Circe", author: "Madeline Miller", genre: "Fantasy", rating: 4.58, reviews: 4102, coverUrl: "https://covers.openlibrary.org/b/id/9255912-M.jpg" },
  { id: 3, title: "Project Hail Mary", author: "Andy Weir", genre: "Science Fiction", rating: 4.65, reviews: 2879, coverUrl: "https://covers.openlibrary.org/b/id/12032488-M.jpg" },
  { id: 4, title: "The Night Circus", author: "Erin Morgenstern", genre: "Fantasy", rating: 4.71, reviews: 3241, coverUrl: "https://covers.openlibrary.org/b/id/8409688-M.jpg" },
];

function CurrentlyReadingCard({ book }: { book: BookData }) {
  return (
    <div className="flex items-center gap-4">
      {book.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-16 h-24 object-cover shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black"
        />
      ) : (
        <div className="w-16 h-24 shrink-0 bg-zinc-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black" />
      )}
      <div className="flex flex-col gap-1.5 min-w-0">
        <div>
          <p className="text-base font-bold font-sans leading-tight truncate">{book.title}</p>
          <p className="text-sm font-semibold font-sans text-zinc-600 truncate">{book.author}</p>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-black text-black" />
          <span className="text-sm font-semibold font-sans">{book.rating?.toFixed(2)}</span>
          <span className="text-sm font-semibold font-sans text-zinc-400">{book.reviews?.toLocaleString()}</span>
        </div>
        {book.genre && <GenreTag genre={book.genre} size="sm" />}
      </div>
    </div>
  );
}

function ReadingDnaOrb({
  label,
  color,
  blurb,
  active,
  onHover,
}: {
  label: string;
  color: string;
  blurb: string;
  active: boolean;
  onHover: (label: string | null) => void;
}) {
  return (
    <button
      type="button"
      className="relative flex flex-col items-center gap-2 group outline-none"
      onMouseEnter={() => onHover(label)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(label)}
      onBlur={() => onHover(null)}
      aria-label={`${label}: ${blurb}`}
    >
      <div
        className={`w-20 h-20 ${color} rounded-full outline-2 -outline-offset-2 outline-black flex items-center justify-center transition-all duration-200 ease-out ${
          active
            ? "scale-125 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ring-4 ring-pink-400/50"
            : "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:scale-125 group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        }`}
      >
        <div
          className={`bg-white rounded-full transition-all duration-200 ${
            active ? "w-5 h-5" : "w-4 h-4 group-hover:w-5 group-hover:h-5"
          }`}
        />
      </div>
      <span
        className={`text-sm font-semibold font-sans transition-colors ${
          active ? "text-pink-500" : "text-black"
        }`}
      >
        {label}
      </span>

      {/* Hover tooltip */}
      <div
        className={`pointer-events-none absolute top-full mt-3 z-20 w-48 px-3 py-2 bg-white outline outline-2 outline-offset-[-2px] outline-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left transition-all duration-200 ${
          active
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-1"
        }`}
      >
        <p className="text-xs font-semibold font-mono uppercase tracking-wide text-pink-500 mb-1">
          {label}
        </p>
        <p className="text-xs font-semibold font-sans leading-snug text-zinc-700">
          {blurb}
        </p>
      </div>
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [hoveredDna, setHoveredDna] = useState<string | null>(null);

  // Start with the mock picks; swap in real, cover-rich recs once they load.
  const [picks, setPicks] = useState<BookData[]>(PICKS);
  const [trending, setTrending] = useState<BookData[]>(TRENDING_FALLBACK);

  useEffect(() => {
    getForYouRecommendations(8)
      .then((recs) => {
        if (recs.length === 0) return;
        setPicks(
          recs.map((r, i) => ({
            id: r.key ? (r.key.split("/").pop() ?? String(i)) : String(i),
            title: r.title,
            author: r.author,
            genre: r.genre ?? undefined,
            coverUrl: r.cover_url,
          })),
        );
      })
      //.catch(() => {/* keep mock picks on failure */});

    getTrendingBooks(10)
      .then((books) => {
        if (books.length === 0) return;
        setTrending(
          books.map((b, i) => ({
            id: b.key ? (b.key.split("/").pop() ?? `trending-${i}`) : `trending-${i}`,
            title: b.title,
            author: b.author,
            coverUrl: b.cover_url,
          })),
        );
      })
      .catch(() => {/* keep fallback trending on failure */});
  }, []);

  return (
    <AppShell>
      <div className="flex flex-1 relative">
        <main className="flex-1 px-12 py-12 overflow-y-auto">
          <h1 className="text-6xl font-bold font-sans mb-10">Discover your next read</h1>

          <section className="mb-10">
            <h2 className="text-3xl font-bold font-sans mb-6">Your Reading DNA</h2>
            <div className="flex items-start gap-8 flex-wrap pb-16">
              {DNA_GENRES.map(({ label, color, blurb }) => (
                <ReadingDnaOrb
                  key={label}
                  label={label}
                  color={color}
                  blurb={blurb}
                  active={hoveredDna === label}
                  onHover={setHoveredDna}
                />
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold font-sans mb-6">Picks for You</h2>
            <div className="flex gap-6 overflow-x-auto pb-2 items-start">
              {picks.map((book) => (
                <div key={book.id} className="shrink-0">
                  <BookCard
                    book={book}
                    size="lg"
                    showSave
                    showHeart
                    onClick={() => router.push(`/books/${book.id}`)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold font-sans mb-6">Trending Books</h2>
            <div className="flex gap-6 overflow-x-auto pb-2 items-start">
              {trending.map((book) => (
                <div key={book.id} className="shrink-0">
                  <BookCard
                    book={book}
                    size="lg"
                    showSave={false}
                    onClick={() => router.push(`/books/${book.id}`)}
                  />
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Soft fade from main content into the sidebar */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 bottom-0 right-80 w-24 z-10 bg-gradient-to-r from-transparent to-white"
        />

        <aside className="w-80 shrink-0 px-8 py-12 overflow-y-auto bg-white relative z-0">
          <h2 className="text-2xl font-bold font-sans mb-6">Currently Reading</h2>
          <div className="flex flex-col gap-6">
            {CURRENTLY_READING.map((book) => (
              <CurrentlyReadingCard key={book.id} book={book} />
            ))}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
