"use client";

import { Heart, BookOpen, Star } from "lucide-react";
import GenreTag from "./GenreTag";

export interface BookData {
  id: number | string;
  title: string;
  author: string;
  genre?: string;
  rating?: number;
  reviews?: number;
  coverUrl?: string | null;
}

interface BookCardProps {
  book: BookData;
  size?: "lg" | "sm";
  showSave?: boolean;
  showHeart?: boolean;
  onClick?: () => void;
}

export default function BookCard({
  book,
  size = "lg",
  showSave = true,
  showHeart = false,
  onClick,
}: BookCardProps) {
  // One fixed footprint so every card in a rail lines up, regardless of
  // title length (text can wrap inside the reserved height).
  const isLg = size === "lg";
  const widthClass = isLg ? "w-52" : "w-32";
  const coverClass = isLg ? "w-52 h-80" : "w-32 h-48";
  const textMinH = isLg ? "min-h-[4.5rem]" : "min-h-[3.75rem]";
  const titleClass = isLg
    ? "text-base font-bold font-sans leading-tight line-clamp-2 break-words"
    : "text-sm font-bold font-sans leading-tight line-clamp-2 break-words";
  const authorClass = isLg
    ? "text-sm font-semibold font-sans text-zinc-600 line-clamp-1 break-words"
    : "text-xs font-semibold font-sans text-zinc-600 line-clamp-1 break-words";

  return (
    <div className={`${widthClass} inline-flex flex-col gap-4 cursor-pointer`} onClick={onClick}>
      <div className={`${coverClass} relative shrink-0`}>
        {book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt={book.title}
            className={`${coverClass} object-cover shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black`}
          />
        ) : (
          <div
            className={`${coverClass} bg-zinc-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black flex items-center justify-center`}
          >
            <BookOpen className="w-10 h-10 text-zinc-400" />
          </div>
        )}
        {showHeart && (
          <button className="absolute top-2 right-2 p-1" aria-label="Favorite">
            <Heart className="w-5 h-4 text-pink-500" fill="currentColor" strokeWidth={2} stroke="black" />
          </button>
        )}
      </div>

      <div className={`self-stretch flex flex-col gap-1 min-w-0 ${textMinH}`}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-col min-w-0 gap-0.5">
            <span className={titleClass}>{book.title}</span>
            <span className={authorClass}>{book.author}</span>
          </div>
          {showHeart && (
            <Heart className="w-5 h-4 text-pink-500 shrink-0 mt-0.5" fill="currentColor" strokeWidth={2} stroke="black" />
          )}
        </div>
        {book.rating != null && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-black text-black" />
            <span className="text-sm font-semibold font-sans">{book.rating.toFixed(2)}</span>
            <span className="text-sm font-semibold font-sans text-zinc-500">
              {book.reviews?.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {(book.genre || showSave) && (
        <div className="flex items-center gap-2.5 flex-wrap min-h-8">
          {book.genre && <GenreTag genre={book.genre} size="sm" />}
          {showSave && (
            <button className="h-8 px-6 py-2 bg-white rounded-md outline outline-2 outline-offset-[-2px] outline-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm font-semibold font-mono hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
              Save
            </button>
          )}
        </div>
      )}
    </div>
  );
}
