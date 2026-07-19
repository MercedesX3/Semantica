"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Check } from "lucide-react";
import AppNav from "@/components/AppNav";
import Btn from "@/components/ui/Btn";
import GenreTag, { GENRES } from "@/components/ui/GenreTag";
import { searchOpenLibrary, ExternalBookResult } from "@/lib/api";

const TOTAL_STEPS = 6;

const MOODS = ["Adventurous", "Contemplative", "Light-hearted", "Dark", "Romantic", "Intense", "Nostalgic", "Mysterious"];
const STORY_PREFS = ["Fast-paced", "Character-driven", "Plot-driven", "Slow-burn", "Mystery", "Epic", "Short stories", "Literary"];
const EMOTIONS = ["Excited", "Nostalgic", "Moved / tearful", "Tense", "Hopeful", "Amused", "Melancholic", "In awe", "Unsettled", "Joyful"];

interface SelectedBook {
  key: string;
  title: string;
  author: string;
  cover_url: string | null;
}

function BookSelectionStep({
  prompt,
  minSelect,
  maxSelect,
  selected,
  onToggle,
}: {
  prompt: string;
  minSelect: number;
  maxSelect: number;
  selected: SelectedBook[];
  onToggle: (book: SelectedBook) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExternalBookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) { setResults([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setLoading(true);
      searchOpenLibrary(trimmed, 12)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const isSelected = (key: string) => selected.some((b) => b.key === key);

  const displayBooks: SelectedBook[] = results.length > 0
    ? results.map((r) => ({ key: r.key, title: r.title, author: r.author, cover_url: r.cover_url }))
    : DUMMY_BOOKS;

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <h1 className="text-5xl font-bold font-sans text-center max-w-2xl leading-tight">{prompt}</h1>

      <div className="h-11 px-4 py-2.5 bg-stone-50 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-2 -outline-offset-2 outline-black inline-flex items-center gap-2.5 w-full max-w-lg">
        <Search className="w-5 h-5 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="bg-transparent outline-none text-lg font-semibold font-sans placeholder:text-black/40 flex-1"
        />
        {loading && <span className="text-xs text-zinc-400 font-mono">...</span>}
      </div>

      <div className="grid grid-cols-6 gap-6 w-full">
        {displayBooks.map((book) => {
          const sel = isSelected(book.key);
          return (
            <button
              key={book.key}
              onClick={() => onToggle(book)}
              className="flex flex-col gap-2 text-left group"
            >
              <div className="relative">
                {book.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className={`w-full aspect-[2/3] object-cover border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${sel ? "opacity-70" : ""}`}
                  />
                ) : (
                  <div className={`w-full aspect-[2/3] bg-zinc-200 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center ${sel ? "opacity-70" : ""}`}>
                    <BookOpen className="w-8 h-8 text-zinc-400" />
                  </div>
                )}
                {sel && (
                  <div className="absolute inset-0 bg-pink-500/30 border-2 border-pink-500 flex items-center justify-center">
                    <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold font-sans leading-tight line-clamp-2">{book.title}</p>
                <p className="text-xs font-semibold font-sans text-zinc-500 truncate">{book.author}</p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-sm font-mono text-zinc-400">
        {selected.length} selected · select {minSelect}–{maxSelect}
      </p>
    </div>
  );
}

function ChipSelectStep({
  prompt,
  options,
  selected,
  onToggle,
  multi = true,
}: {
  prompt: string;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-10 w-full">
      <h1 className="text-5xl font-bold font-sans text-center max-w-2xl leading-tight">{prompt}</h1>
      <div className="flex flex-wrap gap-3 justify-center max-w-3xl">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={`h-11 px-7 py-2.5 rounded-lg text-lg font-semibold font-sans transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-2 -outline-offset-2 outline-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${active ? "bg-pink-500 text-white" : "bg-white text-black"}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GenreSelectStep({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (g: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-10 w-full">
      <h1 className="text-5xl font-bold font-sans text-center max-w-2xl leading-tight">
        What are your preferred genres?
      </h1>
      <div className="flex flex-wrap gap-4 justify-center max-w-3xl">
        {GENRES.map((genre) => {
          const active = selected.includes(genre);
          return (
            <button
              key={genre}
              onClick={() => onToggle(genre)}
              className={`transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${active ? "scale-105" : "opacity-70 hover:opacity-100"}`}
            >
              <GenreTag genre={genre} size="lg" />
              {active && <span className="sr-only">selected</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const DUMMY_BOOKS: SelectedBook[] = [
  { key: "/works/OL82563W", title: "Atmosphere", author: "Taylor Jenkins Reid", cover_url: null },
  { key: "/works/OL20132558W", title: "The Midnight Library", author: "Matt Haig", cover_url: `https://covers.openlibrary.org/b/id/10982982-M.jpg` },
  { key: "/works/OL20668678W", title: "The Night Circus", author: "Erin Morgenstern", cover_url: `https://covers.openlibrary.org/b/id/8409688-M.jpg` },
  { key: "/works/OL17883032W", title: "Circe", author: "Madeline Miller", cover_url: `https://covers.openlibrary.org/b/id/9255912-M.jpg` },
  { key: "/works/OL20825819W", title: "Where the Crawdads Sing", author: "Delia Owens", cover_url: `https://covers.openlibrary.org/b/id/8459529-M.jpg` },
  { key: "/works/OL18376187W", title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", cover_url: `https://covers.openlibrary.org/b/id/9256490-M.jpg` },
  { key: "/works/OL27516W", title: "Brave New World", author: "Aldous Huxley", cover_url: `https://covers.openlibrary.org/b/id/8739161-M.jpg` },
  { key: "/works/OL22832417W", title: "Project Hail Mary", author: "Andy Weir", cover_url: `https://covers.openlibrary.org/b/id/12032488-M.jpg` },
  { key: "/works/OL8764671W", title: "Klara and the Sun", author: "Kazuo Ishiguro", cover_url: `https://covers.openlibrary.org/b/id/12003856-M.jpg` },
  { key: "/works/OL1168532W", title: "Crime and Punishment", author: "Fyodor Dostoevsky", cover_url: `https://covers.openlibrary.org/b/id/8739150-M.jpg` },
  { key: "/works/OL261883W", title: "Pride and Prejudice", author: "Jane Austen", cover_url: `https://covers.openlibrary.org/b/id/8739161-M.jpg` },
  { key: "/works/OL14860W", title: "Frankenstein", author: "Mary Shelley", cover_url: `https://covers.openlibrary.org/b/id/8406786-M.jpg` },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [favBooks, setFavBooks] = useState<SelectedBook[]>([]);
  const [dislikedBooks, setDislikedBooks] = useState<SelectedBook[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [storyPrefs, setStoryPrefs] = useState<string[]>([]);
  const [emotions, setEmotions] = useState<string[]>([]);

  function toggleBook(list: SelectedBook[], set: (v: SelectedBook[]) => void, max: number, book: SelectedBook) {
    const exists = list.find((b) => b.key === book.key);
    if (exists) { set(list.filter((b) => b.key !== book.key)); return; }
    if (list.length < max) set([...list, book]);
  }

  function toggleChip(list: string[], set: (v: string[]) => void, val: string) {
    set(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  }

  function canAdvance() {
    if (step === 1) return favBooks.length >= 5;
    if (step === 2) return dislikedBooks.length >= 3;
    if (step === 3) return genres.length >= 1;
    if (step === 4) return moods.length >= 1;
    if (step === 5) return storyPrefs.length >= 1;
    if (step === 6) return emotions.length >= 1;
    return true;
  }

  function handleNext() {
    if (step < TOTAL_STEPS) { setStep(step + 1); }
    else { router.push("/home"); }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1 flex flex-col items-center px-8 py-12 gap-10">
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`w-8 h-1.5 rounded-full transition-colors ${i + 1 <= step ? "bg-pink-500" : "bg-zinc-200"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <BookSelectionStep
            prompt="Please select 5–10 of your favorite books"
            minSelect={5}
            maxSelect={10}
            selected={favBooks}
            onToggle={(b) => toggleBook(favBooks, setFavBooks, 10, b)}
          />
        )}
        {step === 2 && (
          <BookSelectionStep
            prompt="Please select 3–5 books you don't like"
            minSelect={3}
            maxSelect={5}
            selected={dislikedBooks}
            onToggle={(b) => toggleBook(dislikedBooks, setDislikedBooks, 5, b)}
          />
        )}
        {step === 3 && (
          <GenreSelectStep
            selected={genres}
            onToggle={(g) => toggleChip(genres, setGenres, g)}
          />
        )}
        {step === 4 && (
          <ChipSelectStep
            prompt="What's your current reading mood?"
            options={MOODS}
            selected={moods}
            onToggle={(v) => toggleChip(moods, setMoods, v)}
          />
        )}
        {step === 5 && (
          <ChipSelectStep
            prompt="What are your story preferences?"
            options={STORY_PREFS}
            selected={storyPrefs}
            onToggle={(v) => toggleChip(storyPrefs, setStoryPrefs, v)}
          />
        )}
        {step === 6 && (
          <ChipSelectStep
            prompt="What emotions do you enjoy feeling while reading?"
            options={EMOTIONS}
            selected={emotions}
            onToggle={(v) => toggleChip(emotions, setEmotions, v)}
          />
        )}

        <div className="flex gap-4">
          {step > 1 && (
            <Btn variant="outline" size="lg" onClick={() => setStep(step - 1)}>
              Back
            </Btn>
          )}
          <Btn variant="primary" size="lg" disabled={!canAdvance()} onClick={handleNext}
            className={!canAdvance() ? "opacity-50 cursor-not-allowed" : ""}>
            {step === TOTAL_STEPS ? "Finish" : "Next"}
          </Btn>
        </div>
      </main>
    </div>
  );
}
