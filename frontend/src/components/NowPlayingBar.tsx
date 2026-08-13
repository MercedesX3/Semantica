"use client";

import Link from "next/link";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import { accentColor } from "@/lib/playlist";

/**
 * Persistent player strip. Renders nothing until something is playing, so it
 * never occupies space on a screen with no soundtrack loaded.
 */
export default function NowPlayingBar() {
  const nowPlaying = useNowPlaying();
  if (!nowPlaying) return null;

  const accent = accentColor(nowPlaying.accentColor);
  const chapterPosition = nowPlaying.chapterIndex + 1;

  return (
    <div
      style={{ backgroundColor: accent }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-black px-4 sm:px-6 py-3 flex items-center justify-between gap-4"
    >
      <div className="min-w-0">
        <p className="text-white font-bold font-sans truncate">
          Now Reading: {nowPlaying.bookTitle}
          {nowPlaying.chapterCount > 0 && (
            <span className="font-normal">
              {" "}
              – ch. {chapterPosition} of {nowPlaying.chapterCount}
            </span>
          )}
        </p>
        <p className="text-white/70 text-[0.7rem] sm:text-xs font-mono uppercase tracking-wider truncate">
          Chapter sync
          {nowPlaying.moodLabel ? `: ${nowPlaying.moodLabel}` : ": music shifts with the story"}
        </p>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {nowPlaying.track && (
          <p className="text-white/70 text-xs font-mono uppercase tracking-wider hidden md:block max-w-xs truncate">
            Now playing: {nowPlaying.track.name}
          </p>
        )}

        {nowPlaying.track?.external_url ? (
          <a
            href={nowPlaying.track.external_url}
            target="_blank"
            rel="noreferrer"
            className="h-10 sm:h-11 px-5 sm:px-7 rounded-lg bg-brand text-white edge pop press inline-flex items-center text-sm sm:text-base font-semibold font-sans whitespace-nowrap"
          >
            Open Player
          </a>
        ) : (
          <Link
            href={`/soundtracks/${nowPlaying.bookId}`}
            className="h-10 sm:h-11 px-5 sm:px-7 rounded-lg bg-brand text-white edge pop press inline-flex items-center text-sm sm:text-base font-semibold font-sans whitespace-nowrap"
          >
            Open Player
          </Link>
        )}
      </div>
    </div>
  );
}
