"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, BookOpen, ExternalLink } from "lucide-react";
import AppShell from "@/components/AppShell";
import NowPlayingBar from "@/components/NowPlayingBar";
import { playPlaylist, playTrack, useNowPlaying } from "@/hooks/useNowPlaying";
import { accentColor, buildTrackRows, formatTrackTime, TrackRow } from "@/lib/playlist";
import { getBookPlaylist, BookPlaylist } from "@/lib/api";

function TrackTable({ playlist, rows }: { playlist: BookPlaylist; rows: TrackRow[] }) {
  const nowPlaying = useNowPlaying();

  return (
    <div className="bg-stone-50 edge pop-lg overflow-hidden">
      {/* Column headings */}
      <div className="grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3rem_1fr_14rem_4rem] gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 border-b-2 border-black text-xs font-mono uppercase tracking-wider">
        <span>#</span>
        <span>Track</span>
        <span className="hidden sm:block sm:text-right">Matched to</span>
        <span className="text-right">Time</span>
      </div>

      <ul className="divide-y-2 divide-black/10">
        {rows.map((row) => {
          const isPlaying =
            nowPlaying?.bookId === playlist.book_id &&
            nowPlaying.track?.name === row.track.name &&
            nowPlaying.chapterIndex === row.chapterIndex;

          return (
            <li key={row.key}>
              <button
                type="button"
                onClick={() =>
                  playTrack(playlist, row.track, row.chapterIndex, row.chapterTitle, row.moodLabel)
                }
                aria-label={`Play ${row.track.name} by ${row.track.artist}`}
                className={`w-full grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3rem_1fr_14rem_4rem] gap-3 sm:gap-4 items-center px-4 sm:px-5 py-3 text-left cursor-pointer transition-colors group ${
                  isPlaying ? "bg-brand-soft/40" : "hover:bg-brand-soft/20"
                }`}
              >
                <span className="text-sm font-semibold font-sans text-zinc-600 relative">
                  <span className="group-hover:opacity-0 transition-opacity">{row.position}</span>
                  <Play
                    className="w-3.5 h-3.5 fill-black absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-hidden
                  />
                </span>

                <span className="flex items-center gap-3 min-w-0">
                  {row.track.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.track.image_url}
                      alt=""
                      loading="lazy"
                      className="w-10 h-10 shrink-0 object-cover border-2 border-black"
                    />
                  ) : (
                    <span className="w-10 h-10 shrink-0 bg-brand border-2 border-black" aria-hidden />
                  )}
                  <span className="min-w-0">
                    <span className="block text-base font-bold font-sans leading-tight truncate">
                      {row.track.name}
                    </span>
                    <span className="block text-sm font-semibold font-sans text-zinc-600 truncate">
                      {row.track.artist}
                    </span>
                    {/* Chapter moves under the title once the column is dropped */}
                    {row.chapterLabel && (
                      <span className="sm:hidden block text-xs font-mono text-blue-700 truncate mt-0.5">
                        {row.chapterLabel}
                      </span>
                    )}
                  </span>
                </span>

                <span className="hidden sm:block text-xs font-mono text-blue-700 text-right truncate">
                  {row.chapterLabel ?? "—"}
                </span>

                <span className="text-sm font-semibold font-sans text-right tabular-nums">
                  {formatTrackTime(row.track.duration_ms)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function PlaylistDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [playlist, setPlaylist] = useState<BookPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(bookId);
    if (!Number.isInteger(id)) {
      setError("That playlist reference isn't valid.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    getBookPlaylist(id)
      .then((data) => {
        if (!cancelled) setPlaylist(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load this playlist.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center py-24">
          <p className="text-lg font-semibold font-sans text-zinc-500">Loading playlist…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !playlist) {
    return (
      <AppShell>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
          <p className="text-2xl font-bold font-sans">We couldn&apos;t load this playlist</p>
          <p className="text-base font-semibold font-sans text-zinc-500 max-w-md">
            {error ?? "Unknown error"}
          </p>
          <Link
            href="/soundtracks"
            className="mt-2 h-11 px-6 rounded-lg bg-brand text-white edge pop press inline-flex items-center text-base font-semibold font-sans"
          >
            Back to Soundtracks
          </Link>
        </div>
      </AppShell>
    );
  }

  const accent = accentColor(playlist.accent_color);
  const rows = buildTrackRows(playlist);
  // The detail endpoint omits chapter_count; chapters.length is the source of truth.
  const chapterCount = playlist.chapter_count ?? playlist.chapters.length;

  return (
    <AppShell>
      <main className="flex-1 px-5 sm:px-8 lg:px-12 py-6 lg:py-10 pb-28">
        <Link
          href="/soundtracks"
          className="inline-flex items-center gap-2 text-sm font-semibold font-sans mb-6 hover:text-brand-strong transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          All soundtracks
        </Link>

        {/* Header */}
        <div
          style={{ backgroundColor: accent }}
          className="edge pop-lg p-5 sm:p-8 flex flex-col sm:flex-row gap-6 mb-8"
        >
          {playlist.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={playlist.cover_url}
              alt={`Cover of ${playlist.book_title}`}
              className="w-32 h-48 sm:w-40 sm:h-60 object-cover pop border-2 border-black shrink-0"
            />
          ) : (
            <div className="w-32 h-48 sm:w-40 sm:h-60 bg-black/20 border-2 border-black pop shrink-0 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white/60" aria-hidden />
            </div>
          )}

          <div className="flex flex-col justify-center gap-3 min-w-0">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/80">
              Book soundtrack
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-sans text-white leading-tight text-balance">
              {playlist.playlist_title}
            </h1>
            <p className="text-base sm:text-lg font-semibold font-sans text-white/90">
              from <span className="italic">{playlist.book_title}</span> by {playlist.author}
            </p>
            <p className="text-xs font-mono uppercase tracking-wider text-white/70">
              {playlist.track_count} tracks · {playlist.duration} · {chapterCount} chapters
              · {playlist.spotify_enabled ? "Spotify synced" : "Demo tracks"}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => playPlaylist(playlist)}
                className="h-11 px-6 rounded-lg bg-brand text-white edge pop press inline-flex items-center gap-2 text-base font-semibold font-sans cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" aria-hidden />
                Play from chapter 1
              </button>

              <Link
                href={`/books/${playlist.book_id}`}
                className="h-11 px-6 rounded-lg bg-white text-black edge pop press inline-flex items-center gap-2 text-base font-semibold font-sans"
              >
                <ExternalLink className="w-4 h-4" aria-hidden />
                View book
              </Link>
            </div>
          </div>
        </div>

        {/* Tracks */}
        {rows.length > 0 ? (
          <TrackTable playlist={playlist} rows={rows} />
        ) : (
          <p className="text-base font-semibold text-zinc-600 max-w-lg">
            This playlist doesn&apos;t have any tracks yet.
          </p>
        )}
      </main>

      <NowPlayingBar />
    </AppShell>
  );
}
