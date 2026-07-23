"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import BookCard, { BookData } from "@/components/ui/BookCard";
import GenreTag from "@/components/ui/GenreTag";
import { Star } from "lucide-react";
import { getForYouRecommendations } from "@/lib/api";

const DNA_GENRES = [
  { label: "Romance", color: "bg-pink-300" },
  { label: "Literary", color: "bg-amber-400" },
  { label: "Horror", color: "bg-sky-500" },
  { label: "Classic", color: "bg-emerald-300" },
  { label: "Sci-Fi", color: "bg-blue-700" },
];

const PICKS: BookData[] = [
  { id: 1, title: "Atmosphere", author: "Taylor Jenkins Reid", genre: "Literary", rating: 4.89, reviews: 1209, coverUrl: null },
  { id: 2, title: "The Midnight Library", author: "Matt Haig", genre: "Fiction", rating: 4.53, reviews: 2345, coverUrl: "https://covers.openlibrary.org/b/id/10982982-M.jpg" },
  { id: 3, title: "Klara and the Sun", author: "Kazuo Ishiguro", genre: "Sci-Fi", rating: 4.22, reviews: 1567, coverUrl: "https://covers.openlibrary.org/b/id/12003856-M.jpg" },
  { id: 4, title: "Project Hail Mary", author: "Andy Weir", genre: "Science Fiction", rating: 4.65, reviews: 2879, coverUrl: "https://covers.openlibrary.org/b/id/12032488-M.jpg" },
  { id: 5, title: "The Night Circus", author: "Erin Morgenstern", genre: "Fantasy", rating: 4.71, reviews: 3241, coverUrl: "https://covers.openlibrary.org/b/id/8409688-M.jpg" },
];

const TRENDING: BookData[] = [
  { id: 6, title: "Circe", author: "Madeline Miller", genre: "Fantasy", rating: 4.58, reviews: 4102, coverUrl: "https://covers.openlibrary.org/b/id/9255912-M.jpg" },
  { id: 7, title: "Where the Crawdads Sing", author: "Delia Owens", genre: "Literary", rating: 4.45, reviews: 5678, coverUrl: "https://covers.openlibrary.org/b/id/8459529-M.jpg" },
  { id: 8, title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", genre: "Romance", rating: 4.82, reviews: 6543, coverUrl: "https://covers.openlibrary.org/b/id/9256490-M.jpg" },
  { id: 9, title: "Brave New World", author: "Aldous Huxley", genre: "Dystopian", rating: 4.12, reviews: 9876, coverUrl: "https://covers.openlibrary.org/b/id/8739161-M.jpg" },
  { id: 10, title: "Crime and Punishment", author: "Fyodor Dostoevsky", genre: "Classic", rating: 4.35, reviews: 12453, coverUrl: "https://covers.openlibrary.org/b/id/8739150-M.jpg" },
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

export default function HomePage() {
  const router = useRouter();

  // Start with the mock picks; swap in real, cover-rich recs once they load.
  const [picks, setPicks] = useState<BookData[]>(PICKS);
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
      .catch(() => {/* keep mock picks on failure */});
  }, []);

  return (
    <div className="mx-8 my-4 min-h-[calc(100vh-2rem)] flex flex-col">
      <AppNav />

      <div className="flex flex-1">
        <main className="flex-1 px-12 py-12 overflow-y-auto">
          <h1 className="text-6xl font-bold font-sans mb-10">Discover your next read</h1>

          <section className="mb-10">
            <h2 className="text-3xl font-bold font-sans mb-6">Your Reading DNA</h2>
            <div className="flex items-center gap-8 flex-wrap">
              {DNA_GENRES.map(({ label, color }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className={`w-20 h-20 ${color} rounded-full outline-2 -outline-offset-2 outline-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                  <span className="text-sm font-semibold font-sans">{label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold font-sans mb-6">Picks for You</h2>
            <div className="flex gap-6 overflow-x-auto pb-2">
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
            <div className="flex gap-6 overflow-x-auto pb-2">
              {TRENDING.map((book) => (
                <div key={book.id} className="shrink-0">
                  <BookCard
                    book={book}
                    size="sm"
                    showSave={false}
                    onClick={() => router.push(`/books/${book.id}`)}
                  />
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="w-80 shrink-0 border-l-2 border-black px-8 py-12 overflow-y-auto">
          <h2 className="text-2xl font-bold font-sans mb-6">Currently Reading</h2>
          <div className="flex flex-col gap-6">
            {CURRENTLY_READING.map((book) => (
              <CurrentlyReadingCard key={book.id} book={book} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
