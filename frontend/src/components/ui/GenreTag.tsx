type Size = "lg" | "sm";

interface GenreTagProps {
  genre: string;
  size?: Size;
  className?: string;
}

const GENRE_STYLES: Record<string, { bg: string; text: string }> = {
  Fantasy: { bg: "bg-violet-500", text: "text-stone-50" },
  "Science Fiction": { bg: "bg-blue-700", text: "text-stone-50" },
  "Sci-Fi": { bg: "bg-blue-700", text: "text-stone-50" },
  Dystopian: { bg: "bg-red-500", text: "text-stone-50" },
  Classic: { bg: "bg-emerald-300", text: "text-stone-50" },
  Literary: { bg: "bg-amber-400", text: "text-stone-50" },
  Thriller: { bg: "bg-orange-400", text: "text-stone-50" },
  Horror: { bg: "bg-sky-500", text: "text-stone-50" },
  Romance: { bg: "bg-pink-200", text: "text-black" },
  "Non Fiction": { bg: "bg-emerald-600", text: "text-stone-50" },
  Fiction: { bg: "bg-teal-500", text: "text-stone-50" },
};

const DEFAULT_STYLE = { bg: "bg-zinc-400", text: "text-stone-50" };

export const GENRES = Object.keys(GENRE_STYLES);

export default function GenreTag({ genre, size = "sm", className = "" }: GenreTagProps) {
  const { bg, text } = GENRE_STYLES[genre] ?? DEFAULT_STYLE;
  const sizeClass =
    size === "lg"
      ? "px-7 py-2.5 rounded-lg text-lg font-semibold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline outline-2 outline-offset-[-2px] outline-black"
      : "h-8 px-6 py-2 rounded-md text-sm font-semibold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline outline-2 outline-offset-[-2px] outline-black";

  return (
    <span className={`inline-flex items-center font-mono ${bg} ${text} ${sizeClass} ${className}`}>
      {genre}
    </span>
  );
}
