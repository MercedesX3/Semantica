"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Pencil } from "lucide-react";
import AppShell from "@/components/AppShell";
import BookCard from "@/components/ui/BookCard";
import GenreTag from "@/components/ui/GenreTag";
import { useShelf } from "@/hooks/useShelf";
import { normalizeWorkKey } from "@/lib/api";
import { displayName, initials, resolveSession, signOut, SessionState } from "@/lib/session";
import { readTasteProfile, TasteProfile } from "@/lib/taste";

export default function ProfilePage() {
  const router = useRouter();
  const { books, loading: shelfLoading, toggle } = useShelf();
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [taste, setTaste] = useState<TasteProfile | null>(null);

  useEffect(() => {
    void resolveSession().then(setSession);
    setTaste(readTasteProfile());
  }, []);

  const user = session.status === "authenticated" || session.status === "offline" ? session.user : null;

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <AppShell>
      <main className="flex-1 px-5 sm:px-8 lg:px-12 py-8 lg:py-12">
        {/* Identity */}
        <header className="flex flex-col sm:flex-row sm:items-center gap-5 mb-10">
          <div
            className="w-20 h-20 shrink-0 bg-brand rounded-lg edge pop flex items-center justify-center text-white text-2xl font-bold font-sans"
            aria-hidden
          >
            {initials(user)}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold font-sans tracking-tight truncate">
              {session.status === "loading" ? "…" : displayName(user)}
            </h1>
            <p className="text-base font-semibold text-zinc-600 truncate">
              {user?.email ??
                (session.status === "loading" ? "…" : "Sign in to sync your shelf across devices")}
            </p>
          </div>

          <div className="flex gap-3 shrink-0">
            {/* Offer sign-out only when we actually know who this is. */}
            {!user ? (
              <Link
                href="/login"
                className="h-11 px-6 rounded-lg bg-brand text-white edge pop press inline-flex items-center text-base font-semibold font-sans"
              >
                Sign in
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                className="h-11 px-6 rounded-lg bg-white text-black edge pop press inline-flex items-center gap-2 text-base font-semibold font-sans cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden />
                Sign out
              </button>
            )}
          </div>
        </header>

        {/* Reading profile from onboarding */}
        <section className="mb-10">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-2xl font-bold font-sans">Your reading profile</h2>
            <Link
              href="/onboarding"
              className="h-9 px-4 rounded-md bg-white text-black edge pop-sm press inline-flex items-center gap-1.5 text-sm font-semibold font-mono"
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden />
              {taste ? "Redo" : "Build it"}
            </Link>
          </div>

          {!taste ? (
            <div className="max-w-lg bg-stone-50 edge pop p-6">
              <p className="text-base font-semibold text-zinc-700 leading-relaxed">
                You haven&apos;t built a reading profile yet. It takes about two
                minutes and it&apos;s what every recommendation on Browse is based on.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ProfileGroup title="Genres">
                {taste.genres.length > 0 ? (
                  taste.genres.map((g) => <GenreTag key={g} genre={g} size="sm" />)
                ) : (
                  <Muted>None chosen</Muted>
                )}
              </ProfileGroup>
              <ProfileGroup title="Reading mood">
                {taste.moods.length > 0 ? taste.moods.map((m) => <Chip key={m}>{m}</Chip>) : <Muted>None chosen</Muted>}
              </ProfileGroup>
              <ProfileGroup title="Story preferences">
                {taste.storyPrefs.length > 0 ? (
                  taste.storyPrefs.map((s) => <Chip key={s}>{s}</Chip>)
                ) : (
                  <Muted>None chosen</Muted>
                )}
              </ProfileGroup>
              <ProfileGroup title="Emotions you read for">
                {taste.emotions.length > 0 ? (
                  taste.emotions.map((e) => <Chip key={e}>{e}</Chip>)
                ) : (
                  <Muted>None chosen</Muted>
                )}
              </ProfileGroup>
            </div>
          )}
        </section>

        {/* Shelf */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-2xl font-bold font-sans">Saved books</h2>
            {books.length > 0 && (
              <Link
                href="/library"
                className="text-sm font-semibold font-sans underline decoration-2 underline-offset-4 decoration-brand"
              >
                See all {books.length}
              </Link>
            )}
          </div>

          {shelfLoading ? (
            <p className="text-base font-semibold text-zinc-500">Loading your shelf…</p>
          ) : books.length === 0 ? (
            <p className="text-base font-semibold text-zinc-600 max-w-lg">
              Nothing saved yet — heart a book anywhere in Semantica and it lands here.
            </p>
          ) : (
            <div className="flex gap-6 overflow-x-auto rail pb-2 items-start">
              {books.slice(0, 8).map((book) => (
                <div key={book.id} className="shrink-0">
                  <BookCard
                    book={{
                      id: normalizeWorkKey(book.open_library_key),
                      title: book.title,
                      author: book.author,
                      coverUrl: book.cover_url,
                      openLibraryKey: book.open_library_key,
                    }}
                    size="sm"
                    showHeart
                    favorited
                    onFavorite={() =>
                      toggle({
                        key: book.open_library_key,
                        title: book.title,
                        author: book.author,
                        coverUrl: book.cover_url,
                      })
                    }
                    onClick={() => router.push(`/books/${normalizeWorkKey(book.open_library_key)}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}

function ProfileGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-stone-50 edge pop p-5">
      <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="h-8 px-4 rounded-md bg-white edge pop-sm text-sm font-semibold font-mono inline-flex items-center">
      {children}
    </span>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-semibold text-zinc-400">{children}</span>;
}
