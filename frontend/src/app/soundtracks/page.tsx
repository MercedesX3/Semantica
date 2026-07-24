"use client";

import { Play, BookOpen } from "lucide-react";
import AppShell from "@/components/AppShell";

interface Playlist {
  id: number;
  title: string;
  bookTitle: string;
  trackCount: number;
  duration: string;
  coverUrl: string | null;
  accentColor: string;
}

const PLAYLISTS: Playlist[] = [
  { id: 1, title: "Reading in Low Orbit", bookTitle: "Atmosphere", trackCount: 18, duration: "1HR 12MIN", coverUrl: null, accentColor: "bg-blue-700" },
  { id: 2, title: "Reading in Low Orbit", bookTitle: "Atmosphere", trackCount: 18, duration: "1HR 12MIN", coverUrl: null, accentColor: "bg-blue-700" },
  { id: 3, title: "Reading in Low Orbit", bookTitle: "Atmosphere", trackCount: 18, duration: "1HR 12MIN", coverUrl: null, accentColor: "bg-blue-700" },
  { id: 4, title: "Reading in Low Orbit", bookTitle: "Atmosphere", trackCount: 18, duration: "1HR 12MIN", coverUrl: null, accentColor: "bg-blue-700" },
  { id: 5, title: "Reading in Low Orbit", bookTitle: "Atmosphere", trackCount: 18, duration: "1HR 12MIN", coverUrl: null, accentColor: "bg-blue-700" },
  { id: 6, title: "Reading in Low Orbit", bookTitle: "Atmosphere", trackCount: 18, duration: "1HR 12MIN", coverUrl: null, accentColor: "bg-blue-700" },
];

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <div className="bg-stone-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] outline outline-1 outline-offset-[-1px] outline-black flex flex-col overflow-hidden">
      <div className={`${playlist.accentColor} p-4 flex items-center gap-4`}>
        {playlist.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={playlist.coverUrl}
            alt={playlist.bookTitle}
            className="w-32 h-48 object-cover shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black shrink-0"
          />
        ) : (
          <div className="w-32 h-48 bg-blue-600 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-white/50" />
          </div>
        )}
        <div className="flex flex-col justify-center">
          <p className="text-2xl font-semibold font-sans text-stone-50">{playlist.title}</p>
          <p className="text-base font-semibold font-sans text-stone-50">
            from <span className="italic">{playlist.bookTitle}</span>
          </p>
        </div>
      </div>

      <div className="px-2.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium font-mono">
          <span>{playlist.trackCount} TRACKS</span>
          <div className="w-1 h-1 bg-black rounded-full" />
          <span>{playlist.duration}</span>
          <div className="w-1 h-1 bg-black rounded-full" />
          <span>SYNCED</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 bg-pink-400 rounded-full outline outline-1 outline-offset-[-1px] outline-black flex items-center justify-center">
            <Play className="w-3.5 h-3.5 text-white fill-white" />
          </button>
          <button className="w-6 h-6 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <path d="M9 18V5l12-2v13" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6" cy="18" r="3" stroke="black" strokeWidth="2" />
              <circle cx="18" cy="16" r="3" stroke="black" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SoundtracksPage() {
  return (
    <AppShell>
      <main className="flex-1 px-12 py-12 pb-28">
        <h1 className="text-6xl font-bold font-sans mb-8">Book Soundtracks</h1>

        <section className="mb-10">
          <h2 className="text-2xl font-bold font-sans mb-5">Your Playlists</h2>
          <div className="grid grid-cols-3 gap-5">
            {PLAYLISTS.slice(0, 6).map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold font-sans mb-5">Trending Playlists</h2>
          <div className="grid grid-cols-3 gap-5">
            {PLAYLISTS.map((pl) => (
              <PlaylistCard key={`trending-${pl.id}`} playlist={{ ...pl, accentColor: "bg-violet-600" }} />
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-violet-600 px-6 py-3 flex items-center justify-between z-30">
        <div>
          <p className="text-white font-bold font-sans">Now Reading: Circe – ch. 9 of 27</p>
          <p className="text-white/70 text-xs font-mono uppercase tracking-wider">Chapter sync: music shifts as the store darkins</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-white/70 text-xs font-mono uppercase tracking-wider">NOW PLAYING: SALT AND CREAM</p>
          <button className="h-11 px-7 py-2.5 bg-pink-500 rounded-lg outline-2 -outline-offset-2 outline-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg font-semibold font-sans text-white">
            Open Player
          </button>
        </div>
      </div>
    </AppShell>
  );
}
