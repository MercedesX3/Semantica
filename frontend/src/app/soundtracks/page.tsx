"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import ComingSoon from "@/components/ComingSoon";
import PlaylistCard from "@/components/PlaylistCard";
import NowPlayingBar from "@/components/NowPlayingBar";
import { useShelf } from "@/hooks/useShelf";
import { playPlaylist } from "@/hooks/useNowPlaying";
import { listPlaylists, getBookPlaylist, PlaylistSummary } from "@/lib/api";

function PlaylistGrid({
  playlists,
  onPlay,
}: {
  playlists: PlaylistSummary[];
  onPlay: (playlist: PlaylistSummary) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
      {playlists.map((playlist) => (
        <PlaylistCard key={playlist.book_id} playlist={playlist} onPlay={() => onPlay(playlist)} />
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="bg-stone-50 edge pop-lg animate-pulse">
          <div className="bg-zinc-200 p-4 flex items-center gap-4">
            <div className="w-24 h-36 lg:w-28 lg:h-42 bg-zinc-300 border-2 border-black shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-5 bg-zinc-300 rounded w-3/4" />
              <div className="h-4 bg-zinc-300 rounded w-1/2" />
            </div>
          </div>
          <div className="h-12 border-t-2 border-black" />
        </div>
      ))}
    </div>
  );
}

export default function SoundtracksPage() {
  const { books: shelf } = useShelf();
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listPlaylists()
      .then((data) => {
        if (!cancelled) setPlaylists(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load playlists");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * "Yours" are soundtracks for books on the reader's shelf; everything else is
   * surfaced as trending. A real split on available data, rather than inventing
   * a separate trending feed.
   */
  const { mine, trending } = useMemo(() => {
    const shelfTitles = new Set(shelf.map((b) => b.title.toLowerCase()));
    const mine: PlaylistSummary[] = [];
    const trending: PlaylistSummary[] = [];
    for (const playlist of playlists) {
      (shelfTitles.has(playlist.book_title.toLowerCase()) ? mine : trending).push(playlist);
    }
    return { mine, trending };
  }, [playlists, shelf]);

  async function handlePlay(summary: PlaylistSummary) {
    try {
      const full = await getBookPlaylist(summary.book_id);
      playPlaylist(full);
    } catch {
      // Nothing to play — the bar simply stays as it was.
    }
  }

  // Soundtracks are generated from analysed chapter DNA. With none available
  // there is genuinely nothing to show, so gate rather than render an empty grid.
  if (!loading && playlists.length === 0) {
    return (
      <AppShell>
        <ComingSoon
          eyebrow="In beta"
          title="Book Soundtracks"
          body={
            error
              ? "We couldn't reach the soundtrack service just now. Playlists appear here once a book has been ingested and its chapter DNA analysed."
              : "Each chapter's mood becomes its own run of tracks, so the music shifts as the story does. Playlists appear here once a book has been ingested and its chapter DNA analysed."
          }
          bullets={[
            "Chapter-by-chapter track sequences built from emotion and pacing",
            "Opens straight into Spotify, with demo tracks as a fallback",
            "The now-playing bar follows where you are in the book",
          ]}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex-1 px-5 sm:px-8 lg:px-12 py-8 lg:py-12 pb-28">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-sans tracking-tight mb-8">
          Book Soundtracks
        </h1>

        <section className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold font-sans mb-5">Your Playlists</h2>
          {loading ? (
            <GridSkeleton />
          ) : mine.length > 0 ? (
            <PlaylistGrid playlists={mine} onPlay={handlePlay} />
          ) : (
            <p className="text-base font-semibold text-zinc-600 max-w-lg">
              None of the books on your shelf have a soundtrack yet. Save a book
              that does and it&apos;ll show up here.
            </p>
          )}
        </section>

        {trending.length > 0 && (
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold font-sans mb-5">Trending Playlists</h2>
            <PlaylistGrid playlists={trending} onPlay={handlePlay} />
          </section>
        )}
      </main>

      <NowPlayingBar />
    </AppShell>
  );
}
