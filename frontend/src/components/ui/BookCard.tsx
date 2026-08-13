"use client";

import { Heart, BookOpen, Star, Check } from "lucide-react";
import GenreTag from "./GenreTag";

export interface BookData {
  id: number | string;
  title: string;
  author: string;
  genre?: string;
  rating?: number;
  reviews?: number;
  coverUrl?: string | null;
  openLibraryKey?: string | null;
  favorited?: boolean;
  saved?: boolean;
}

interface BookCardProps {
  book: BookData;
  size?: "lg" | "sm";
  /** Show the "Save to shelf" button beside the genre tag. */
  showSave?: boolean;
  saved?: boolean;
  onSave?: () => void;
  showHeart?: boolean;
  favorited?: boolean;
  onClick?: () => void;
  onFavorite?: () => void;
}

export default function BookCard({
  book,
  size = "lg",
  showSave = false,
  saved = false,
  onSave,
  showHeart = false,
  favorited = false,
  onClick,
  onFavorite,
}: BookCardProps) {
  // One fixed footprint so every card in a rail lines up, regardless of
  // title length (text can wrap inside the reserved height).
  const isLg = size === "lg";
  const widthClass = isLg ? "w-40 sm:w-48 lg:w-52" : "w-28 sm:w-32";
  const coverClass = isLg ? "w-40 h-60 sm:w-48 sm:h-72 lg:w-52 lg:h-80" : "w-28 h-42 sm:w-32 sm:h-48";
  const textMinH = isLg ? "min-h-[4.5rem]" : "min-h-[3.75rem]";
  const titleClass = isLg
    ? "text-base font-bold font-sans leading-tight line-clamp-2 break-words"
    : "text-sm font-bold font-sans leading-tight line-clamp-2 break-words";
  const authorClass = isLg
    ? "text-sm font-semibold font-sans text-zinc-600 line-clamp-1 break-words"
    : "text-xs font-semibold font-sans text-zinc-600 line-clamp-1 break-words";

  return (
    <div className={`${widthClass} inline-flex flex-col gap-3`}>
      <button
        type="button"
        onClick={onClick}
        aria-label={`${book.title} by ${book.author}`}
        className={`${coverClass} relative shrink-0 block group cursor-pointer`}
      >
        {book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt=""
            loading="lazy"
            className={`${coverClass} object-cover pop border-2 border-black transition-transform duration-150 group-hover:-translate-y-1`}
          />
        ) : (
          <div
            className={`${coverClass} bg-zinc-200 pop border-2 border-black flex flex-col items-center justify-center gap-2 px-3 transition-transform duration-150 group-hover:-translate-y-1`}
          >
            <BookOpen className="w-8 h-8 text-zinc-400" />
            <span className="text-xs font-mono uppercase tracking-wide text-zinc-500 text-center line-clamp-3">
              {book.title}
            </span>
          </div>
        )}
        {showHeart && (
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              onFavorite?.();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onFavorite?.();
              }
            }}
            className="absolute top-2 right-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border-2 border-black pop-sm cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
            aria-label={favorited ? `Remove ${book.title} from favourites` : `Add ${book.title} to favourites`}
          >
            <Heart
              className={`w-4.5 h-4.5 ${favorited ? "text-brand-strong" : "text-zinc-900"}`}
              fill={favorited ? "currentColor" : "none"}
              strokeWidth={2}
              stroke="currentColor"
            />
          </span>
        )}
      </button>

      <div className={`self-stretch flex flex-col gap-1 min-w-0 ${textMinH}`}>
        <div className="flex flex-col min-w-0 gap-0.5">
          <span className={titleClass}>{book.title}</span>
          <span className={authorClass}>{book.author}</span>
        </div>
        {book.rating != null && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-black" strokeWidth={1.5} />
            <span className="text-sm font-semibold font-sans">{book.rating.toFixed(2)}</span>
            {book.reviews != null && (
              <span className="text-sm font-semibold font-sans text-zinc-500">
                {book.reviews.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {(book.genre || showSave) && (
        <div className="flex items-center gap-2 flex-wrap min-h-8">
          {book.genre && <GenreTag genre={book.genre} size="sm" />}
          {showSave && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSave?.();
              }}
              aria-pressed={saved}
              className={`h-8 px-4 rounded-md text-sm font-semibold font-mono inline-flex items-center gap-1.5 edge pop press cursor-pointer ${
                saved ? "bg-brand text-white" : "bg-white text-black"
              }`}
            >
              {saved && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              {saved ? "Saved" : "Save"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
