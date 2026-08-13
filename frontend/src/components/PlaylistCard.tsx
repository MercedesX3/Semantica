"use client";

import { useRouter } from "next/navigation";
import { Play, BookOpen } from "lucide-react";
import type { PlaylistSummary } from "@/lib/api";
import { accentColor } from "@/lib/playlist";

/** Spotify glyph — lucide has no brand marks. */
function SpotifyMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 1 1-.277-1.215c3.809-.87 7.077-.496 9.713 1.115a.623.623 0 0 1 .206.857Zm1.223-2.722a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.13-9.965-1.166a.78.78 0 0 1-.452-1.492c3.632-1.102 8.147-.568 11.232 1.329a.78.78 0 0 1 .257 1.072Zm.105-2.835c-3.223-1.914-8.54-2.09-11.617-1.156a.935.935 0 1 1-.542-1.79c3.532-1.072 9.404-.865 13.115 1.338a.935.935 0 1 1-.956 1.608Z" />
    </svg>
  );
}

/**
 * Soundtrack card: accent block with the book cover and playlist title, and a
 * meta strip with the play control and a Spotify link when one exists.
 */
export default function PlaylistCard({
  playlist,
  onPlay,
}: {
  playlist: PlaylistSummary;
  onPlay: () => void;
}) {
  const router = useRouter();
  const accent = accentColor(playlist.accent_color);
  const href = `/soundtracks/${playlist.book_id}`;

  return (
    <div className="bg-stone-50 edge pop-lg flex flex-col overflow-hidden">
      <button
        type="button"
        onClick={() => router.push(href)}
        aria-label={`Open ${playlist.playlist_title}, the soundtrack for ${playlist.book_title}`}
        style={{ backgroundColor: accent }}
        className="p-4 flex items-center gap-4 text-left cursor-pointer group w-full"
      >
        {playlist.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={playlist.cover_url}
            alt=""
            loading="lazy"
            className="w-24 h-36 lg:w-28 lg:h-42 object-cover pop border-2 border-black shrink-0 transition-transform duration-150 group-hover:-translate-y-1"
          />
        ) : (
          <div className="w-24 h-36 lg:w-28 lg:h-42 bg-black/20 border-2 border-black pop shrink-0 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white/60" aria-hidden />
          </div>
        )}

        <span className="flex flex-col justify-center min-w-0">
          <span className="block text-xl lg:text-2xl font-bold font-sans text-white leading-tight line-clamp-3">
            {playlist.playlist_title}
          </span>
          <span className="block text-sm lg:text-base font-semibold font-sans text-white/90 mt-1">
            from <span className="italic">{playlist.book_title}</span>
          </span>
        </span>
      </button>

      <div className="px-3 py-2.5 flex items-center justify-between gap-3 border-t-2 border-black">
        <div className="flex items-center gap-2 text-[0.7rem] sm:text-xs font-medium font-mono uppercase min-w-0">
          <span className="whitespace-nowrap">{playlist.track_count} tracks</span>
          <span className="w-1 h-1 bg-black rounded-full shrink-0" aria-hidden />
          <span className="whitespace-nowrap">{playlist.duration}</span>
          <span className="w-1 h-1 bg-black rounded-full shrink-0" aria-hidden />
          <span className="truncate">{playlist.spotify_enabled ? "Synced" : "Demo"}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onPlay}
            aria-label={`Play ${playlist.playlist_title}`}
            className="w-9 h-9 bg-brand rounded-full edge-thin flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          >
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" aria-hidden />
          </button>

          {playlist.spotify_enabled && (
            <span
              className="w-9 h-9 bg-[#1DB954] rounded-full edge-thin flex items-center justify-center text-white"
              title="Synced with Spotify"
            >
              <SpotifyMark className="w-5 h-5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
