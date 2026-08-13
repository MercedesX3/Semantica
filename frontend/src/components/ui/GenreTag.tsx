type Size = "lg" | "sm";

interface GenreTagProps {
  genre: string;
  size?: Size;
  className?: string;
}

/**
 * Text colour is chosen per swatch for contrast — light fills take black
 * text, saturated fills take white. Previously every chip used stone-50,
 * which was unreadable on the amber/emerald/pink swatches.
 */
const GENRE_STYLES: Record<string, { bg: string; text: string }> = {
  Fantasy: { bg: "bg-violet-500", text: "text-white" },
  "Science Fiction": { bg: "bg-blue-700", text: "text-white" },
  "Sci-Fi": { bg: "bg-blue-700", text: "text-white" },
  Dystopian: { bg: "bg-red-500", text: "text-white" },
  Classic: { bg: "bg-emerald-300", text: "text-black" },
  Literary: { bg: "bg-amber-400", text: "text-black" },
  Thriller: { bg: "bg-orange-400", text: "text-black" },
  Horror: { bg: "bg-sky-500", text: "text-white" },
  Mystery: { bg: "bg-indigo-500", text: "text-white" },
  Historical: { bg: "bg-yellow-300", text: "text-black" },
  Poetry: { bg: "bg-rose-300", text: "text-black" },
  Romance: { bg: "bg-pink-200", text: "text-black" },
  "Non Fiction": { bg: "bg-emerald-600", text: "text-white" },
  Fiction: { bg: "bg-teal-500", text: "text-white" },
};

const DEFAULT_STYLE = { bg: "bg-zinc-300", text: "text-black" };

export const GENRES = Object.keys(GENRE_STYLES);

/** Map the loose genre strings the APIs return onto our known swatches. */
const ALIASES: Record<string, string> = {
  "sci fi": "Sci-Fi",
  scifi: "Sci-Fi",
  "science-fiction": "Science Fiction",
  nonfiction: "Non Fiction",
  "non-fiction": "Non Fiction",
  classics: "Classic",
  "literary fiction": "Literary",
  "historical fiction": "Historical",
};

function resolve(genre: string) {
  if (GENRE_STYLES[genre]) return GENRE_STYLES[genre];
  const key = genre.trim().toLowerCase();
  const aliased = ALIASES[key];
  if (aliased) return GENRE_STYLES[aliased];
  const cased = GENRES.find((g) => g.toLowerCase() === key);
  return cased ? GENRE_STYLES[cased] : DEFAULT_STYLE;
}

export default function GenreTag({ genre, size = "sm", className = "" }: GenreTagProps) {
  const { bg, text } = resolve(genre);
  const sizeClass =
    size === "lg"
      ? "px-6 py-2.5 rounded-lg text-base sm:text-lg font-semibold pop edge"
      : "h-8 px-4 rounded-md text-sm font-semibold pop edge";

  return (
    <span className={`inline-flex items-center font-mono ${bg} ${text} ${sizeClass} ${className}`}>
      {genre}
    </span>
  );
}
