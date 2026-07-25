"use client";

import { useEffect, useState } from "react";
import { Play, BookOpen } from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  listPlaylists,
  getBookPlaylist,
  PlaylistSummary,
  BookPlaylist,
  PlaylistTrack,
} from "@/lib/api";

const ACCENT_FALLBACK = "bg-violet-600";

function PlaylistCard({
  playlist,
  selected,
  onSelect,
}: {
  playlist: PlaylistSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const accent = playlist.accent_color || ACCENT_FALLBACK;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left bg-stone-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] outline outline-1 outline-offset-[-1px] outline-black flex flex-col overflow-hidden w-full transition-transform ${
        selected ? "translate-x-[2px] translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : ""
      }`}
    >
      <div className={`${accent} p-4 flex items-center gap-4`}>
        {playlist.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={playlist.cover_url}
            alt={playlist.book_title}
            className="w-32 h-48 object-cover shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black shrink-0"
          />
        ) : (
          <div className="w-32 h-48 bg-black/20 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-white/50" />
          </div>
        )}
        <div className="flex flex-col justify-center min-w-0">
          <p className="text-2xl font-semibold font-sans text-stone-50 line-clamp-2">
            {playlist.playlist_title}
          </p>
          <p className="text-base font-semibold font-sans text-stone-50">
            from <span className="italic">{playlist.book_title}</span>
          </p>
          <p className="text-xs font-mono text-white/70 mt-2 uppercase tracking-wider">
            {playlist.chapter_count} chapters · DNA synced
          </p>
        </div>
      </div>

      <div className="px-2.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium font-mono">
          <span>{playlist.track_count} TRACKS</span>
          <div className="w-1 h-1 bg-black rounded-full" />
          <span>{playlist.duration}</span>
          <div className="w-1 h-1 bg-black rounded-full" />
          <span>{playlist.spotify_enabled ? "SPOTIFY" : "DEMO"}</span>
        </div>
        <div className="w-9 h-9 bg-pink-400 rounded-full outline outline-1 outline-offset-[-1px] outline-black flex items-center justify-center">
          <Play className="w-3.5 h-3.5 text-white fill-white" />
        </div>
      </div>
    </button>
  );
}

export default function SoundtracksPage() {
  const [summaries, setSummaries] = useState<PlaylistSummary[]>([]);
  const [active, setActive] = useState<BookPlaylist | null>(null);
  const [nowPlaying, setNowPlaying] = useState<PlaylistTrack | null>(null);
  const [chapterLabel, setChapterLabel] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPlaylists()
      .then((data) => {
        setSummaries(data);
        if (data[0]) {
          return getBookPlaylist(data[0].book_id).then((full) => {
            setActive(full);
            const firstChapter = full.chapters[0];
            const firstTrack = full.tracks[0] ?? null;
            setNowPlaying(firstTrack);
            setChapterLabel(
              firstChapter
                ? `${firstChapter.title} · ${firstChapter.mood.mood_label}`
                : "",
            );
          });
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load playlists"))
      .finally(() => setLoading(false));
  }, []);

  async function selectPlaylist(bookId: number) {
    try {
      const full = await getBookPlaylist(bookId);
      setActive(full);
      const firstChapter = full.chapters[0];
      setNowPlaying(full.tracks[0] ?? null);
      setChapterLabel(
        firstChapter
          ? `${firstChapter.title} · ${firstChapter.mood.mood_label}`
          : "",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load playlist");
    }
  }

  const barAccent = active?.accent_color || ACCENT_FALLBACK;

  return (
    <AppShell>
      <main className="flex-1 px-12 py-12 pb-28">
        <h1 className="text-6xl font-bold font-sans mb-8">Book Soundtracks</h1>

        {loading && (
          <p className="text-zinc-500 font-semibold font-sans">Building playlists from chapter DNA…</p>
        )}
        {error && (
          <p className="text-red-600 font-semibold font-sans mb-6">{error}</p>
        )}
        {!loading && summaries.length === 0 && !error && (
          <div className="max-w-xl">
            <p className="text-lg font-semibold font-sans text-zinc-700 mb-2">
              No DNA-synced playlists yet.
            </p>
            <p className="text-sm font-semibold font-sans text-zinc-500">
              Ingest a book and wait for analysis to finish — each chapter&apos;s
              emotion and pacing become a Spotify (or demo) track sequence.
            </p>
          </div>
        )}

        {summaries.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold font-sans mb-5">Your Playlists</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {summaries.map((pl) => (
                <PlaylistCard
                  key={pl.book_id}
                  playlist={pl}
                  selected={active?.book_id === pl.book_id}
                  onSelect={() => selectPlaylist(pl.book_id)}
                />
              ))}
            </div>
          </section>
        )}

        {active && active.chapters.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold font-sans mb-5">
              Chapter arc — {active.book_title}
            </h2>
            <div className="flex flex-col gap-4">
              {active.chapters.map((ch) => (
                <div
                  key={ch.chapter_index}
                  className="outline outline-2 outline-offset-[-2px] outline-black bg-stone-50 p-4"
                >
                  <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
                    <h3 className="text-lg font-bold font-sans">{ch.title}</h3>
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                      {ch.mood.mood_label}
                      {ch.mood.theme ? ` · ${ch.mood.theme}` : ""}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {ch.tracks.map((t) => (
                      <li key={`${ch.chapter_index}-${t.id ?? t.name}`}>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between gap-3 text-left hover:bg-white px-2 py-1.5"
                          onClick={() => {
                            setNowPlaying(t);
                            setChapterLabel(`${ch.title} · ${ch.mood.mood_label}`);
                          }}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-bold font-sans truncate">{t.name}</span>
                            <span className="block text-xs font-semibold font-sans text-zinc-500 truncate">
                              {t.artist}
                            </span>
                          </span>
                          <Play className="w-4 h-4 shrink-0" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {nowPlaying && active && (
        <div className={`fixed bottom-0 left-0 right-0 ${barAccent} px-6 py-3 flex items-center justify-between z-30 gap-4`}>
          <div className="min-w-0">
            <p className="text-white font-bold font-sans truncate">
              Now Reading: {active.book_title}
              {chapterLabel ? ` — ${chapterLabel}` : ""}
            </p>
            <p className="text-white/70 text-xs font-mono uppercase tracking-wider truncate">
              Chapter sync: music shifts with the emotional DNA
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <p className="text-white/70 text-xs font-mono uppercase tracking-wider hidden sm:block max-w-xs truncate">
              NOW PLAYING: {nowPlaying.name}
            </p>
            {nowPlaying.external_url ? (
              <a
                href={nowPlaying.external_url}
                target="_blank"
                rel="noreferrer"
                className="h-11 px-7 py-2.5 bg-pink-500 rounded-lg outline-2 -outline-offset-2 outline-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg font-semibold font-sans text-white inline-flex items-center"
              >
                Open in Spotify
              </a>
            ) : (
              <button className="h-11 px-7 py-2.5 bg-pink-500 rounded-lg outline-2 -outline-offset-2 outline-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg font-semibold font-sans text-white">
                Demo Track
              </button>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
