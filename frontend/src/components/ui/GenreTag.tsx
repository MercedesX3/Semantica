type Size = "lg" | "sm";

interface GenreTagProps {
  genre: string;
  size?: Size;
  className?: string;
}

/**
 * The genre palette for the whole product.
 *
 * `bg`/`text` are Tailwind classes for DOM chips; `hex` is the same colour for
 * surfaces that can't use classes — the Book Map draws its nodes onto a canvas.
 * They live in one table so a genre can never be violet in one place and amber
 * in another.
 *
 * Text colour is chosen per swatch for contrast — light fills take black text,
 * saturated fills take white.
 */
const GENRE_STYLES: Record<string, { bg: string; text: string; hex: string }> = {
  Fantasy: { bg: "bg-violet-500", text: "text-white", hex: "#8b5cf6" },
  "Science Fiction": { bg: "bg-blue-700", text: "text-white", hex: "#1d4ed8" },
  "Sci-Fi": { bg: "bg-blue-700", text: "text-white", hex: "#1d4ed8" },
  Dystopian: { bg: "bg-red-500", text: "text-white", hex: "#ef4444" },
  Classic: { bg: "bg-emerald-300", text: "text-black", hex: "#6ee7b7" },
  Literary: { bg: "bg-amber-400", text: "text-black", hex: "#fbbf24" },
  Thriller: { bg: "bg-orange-400", text: "text-black", hex: "#fb923c" },
  Horror: { bg: "bg-sky-500", text: "text-white", hex: "#0ea5e9" },
  Mystery: { bg: "bg-indigo-500", text: "text-white", hex: "#6366f1" },
  Historical: { bg: "bg-yellow-300", text: "text-black", hex: "#fde047" },
  Poetry: { bg: "bg-rose-300", text: "text-black", hex: "#fda4af" },
  Romance: { bg: "bg-pink-200", text: "text-black", hex: "#fbcfe8" },
  "Non Fiction": { bg: "bg-emerald-600", text: "text-white", hex: "#059669" },
  Fiction: { bg: "bg-teal-500", text: "text-white", hex: "#14b8a6" },
};

const DEFAULT_STYLE = { bg: "bg-zinc-300", text: "text-black", hex: "#d4d4d8" };

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

/** The genre's hex swatch, for canvas and other non-class surfaces. */
export function genreHex(genre: string): string {
  return resolve(genre).hex;
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
