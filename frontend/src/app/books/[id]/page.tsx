"use client";

import { useParams } from "next/navigation";
import { Heart, Star, ChevronDown, Search } from "lucide-react";
import AppNav from "@/components/AppNav";
import Btn from "@/components/ui/Btn";

const BOOK_DETAILS: Record<string, {
  title: string; author: string; genre: string; rating: number;
  ratings: number; coverUrl: string | null; description: string;
  pacing: number; themes: string[];
}> = {
  "1": { title: "Atmosphere", author: "Taylor Jenkins Reid", genre: "Romance", rating: 4.22, ratings: 1567, coverUrl: null, description: "2024: Each time I read what PBS dubs the perfect American novel, my heart fills just a little more. There are few books where the beginning paragraphs hit a home run for me, and this is one of them. It has been a long month filled with family time and endless cooking so for the last ten days I", pacing: 30, themes: ["identity", "forbidden love"] },
  "2": { title: "The Midnight Library", author: "Matt Haig", genre: "Fiction", rating: 4.53, ratings: 2345, coverUrl: "https://covers.openlibrary.org/b/id/10982982-M.jpg", description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices.", pacing: 55, themes: ["regret", "second chances", "identity"] },
  "3": { title: "Klara and the Sun", author: "Kazuo Ishiguro", genre: "Sci-Fi", rating: 4.22, ratings: 1567, coverUrl: "https://covers.openlibrary.org/b/id/12003856-M.jpg", description: "Klara is an Artificial Friend with outstanding observational qualities, who has noticed not just the actions of humans but also the love they feel.", pacing: 20, themes: ["consciousness", "love", "sacrifice"] },
  "4": { title: "Project Hail Mary", author: "Andy Weir", genre: "Science Fiction", rating: 4.65, ratings: 2879, coverUrl: "https://covers.openlibrary.org/b/id/12032488-M.jpg", description: "Ryland Grace is the sole survivor on a desperate, last-chance mission — and if he fails, humanity and the Earth itself will perish.", pacing: 80, themes: ["survival", "friendship", "science"] },
  "5": { title: "The Night Circus", author: "Erin Morgenstern", genre: "Fantasy", rating: 4.71, ratings: 3241, coverUrl: "https://covers.openlibrary.org/b/id/8409688-M.jpg", description: "The circus arrives without warning. No announcements precede it. It is simply there, when yesterday it was not. Within the black-and-white striped tents is an utterly unique experience.", pacing: 40, themes: ["magic", "forbidden love", "rivalry"] },
};

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

function EmotionalDNA({ pacing, themes }: { pacing: number; themes: string[] }) {
  const W = 500, H = 96;
  const mid = H * 0.55; // dashed baseline sits at 55% from top
  const pts = SENTIMENT_PTS.map(([x, y]) => `${(x / 100) * W},${H - (y / 100) * H}`).join(" ");

  return (
    <div className="bg-stone-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] outline-1 -outline-offset-1 outline-black p-4 flex flex-col gap-3">

      {/* Header */}
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

      {/* Chart */}
      <div className="relative w-full" style={{ height: H }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
          {/* dashed midline */}
          <line x1="0" y1={mid} x2={W} y2={mid} stroke="#a3a3a3" strokeWidth="2.5" strokeDasharray="9 5" />
          {/* sentiment arc */}
          <polyline
            points={pts}
            fill="none"
            stroke="#ec4899"
            strokeWidth="3.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        {/* pink selection highlight */}
        <div
          className="absolute outline-4 outline-pink-500 pointer-events-none"
          style={{ left: 12, right: 12, top: Math.round(mid - 4), height: 64 }}
        />
      </div>

      {/* Axis labels */}
      <div className="flex justify-between text-xs font-bold font-mono">
        <span>BEGINNING</span>
        <span>END</span>
      </div>

      {/* Pacing bar */}
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-semibold font-mono shrink-0">PACING</span>
        <div className="flex-1 h-7 rounded-sm outline-1 -outline-offset-1 outline-black flex overflow-hidden">
          <div className="bg-red-500 h-full" style={{ width: `${pacing}%` }} />
          <div className="bg-white flex-1 h-full" />
        </div>
        <span className="text-sm font-semibold font-mono shrink-0">SLOW-BURN</span>
      </div>

      {/* Theme chips */}
      <div className="flex gap-2 flex-wrap">
        {themes.map((t) => (
          <span
            key={t}
            className="h-8 px-6 py-2 bg-white rounded-md outline-2 -outline-offset-2 outline-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm font-semibold font-mono inline-flex items-center"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const book = BOOK_DETAILS[id] ?? BOOK_DETAILS["1"];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AppNav />

      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL (amber) ─────────────────────────────── */}
        <div className="w-1/2 shrink-0 bg-amber-300 overflow-y-auto">
          <div className="p-10 flex flex-col gap-8">

            {/* Cover + book meta */}
            <div className="flex gap-8 items-start">
              {/* Cover */}
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

              {/* Meta column */}
              <div className="flex flex-col gap-3 pt-2 min-w-0 flex-1">
                <h1 className="text-5xl font-medium font-serif italic leading-tight">
                  {book.title}
                </h1>

                <p className="text-base font-bold font-sans">{book.author}</p>

                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-black" strokeWidth={1.5} />
                  <span className="text-base font-bold font-sans">{book.rating.toFixed(2)}</span>
                  <span className="text-base font-semibold font-sans text-pink-500">
                    {book.ratings.toLocaleString()} Ratings
                  </span>
                </div>

                {/* Genre chip — simple outline only */}
                <span className="self-start px-4 py-1 rounded-md border border-black text-sm font-semibold font-sans">
                  {book.genre}
                </span>

                {/* Want to Read + heart — justify-between */}
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

            {/* Description */}
            <div>
              <h2 className="text-3xl font-bold font-sans text-amber-600 mb-3">Description</h2>
              <p className="text-base font-bold font-sans leading-relaxed text-amber-950">
                {book.description}
              </p>
            </div>

            {/* Emotional DNA */}
            <EmotionalDNA pacing={book.pacing} themes={book.themes} />

          </div>
        </div>

        {/* ── RIGHT PANEL (white) ────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden border-l-2 border-black">

          {/* Tabs — right-aligned */}
          <div className="px-6 py-4 flex items-center justify-end gap-8 border-b-2 border-black shrink-0">
            <button className="text-base font-bold font-sans underline decoration-2 underline-offset-4">
              REVIEWS
            </button>
            <button className="text-base font-bold font-sans">SIMILAR BOOKS</button>
            <button className="text-base font-bold font-sans">SHOP</button>
          </div>

          {/* Search */}
          <div className="px-6 py-4 flex items-center gap-3 border-b-2 border-black shrink-0">
            <div className="flex-1 h-11 px-4 bg-stone-50 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-2 -outline-offset-2 outline-black flex items-center gap-2.5">
              <Search className="w-5 h-5 shrink-0" />
              <input
                placeholder="Search..."
                className="bg-transparent outline-none text-base font-semibold font-sans flex-1 placeholder:text-black/40"
              />
            </div>
            <Btn variant="primary" size="lg">Search</Btn>
          </div>

          {/* Reviews */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {DUMMY_REVIEWS.map((r, i) => (
              <div key={i} className="flex gap-5 px-6 py-5">
                {/* Reviewer */}
                <div className="flex flex-col items-center gap-1 shrink-0 w-24 text-center">
                  <div className="w-12 h-12 bg-black rounded-full mb-1" />
                  <p className="text-xs font-semibold font-mono">{r.name}</p>
                  <p className="text-xs font-medium font-mono text-zinc-400">{r.reviewCount.toLocaleString()} Reviews</p>
                  <p className="text-xs font-medium font-mono text-zinc-400">{r.followers}k Followers</p>
                  <Btn variant="primary" size="sm" className="mt-1.5 w-full">Follow</Btn>
                </div>

                {/* Review text */}
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
    </div>
  );
}
