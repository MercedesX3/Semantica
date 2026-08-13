"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Library as LibraryIcon } from "lucide-react";
import AppShell from "@/components/AppShell";
import BookCard from "@/components/ui/BookCard";
import { useShelf } from "@/hooks/useShelf";
import { normalizeWorkKey } from "@/lib/api";

export default function LibraryPage() {
  const router = useRouter();
  const { books, loading, toggle } = useShelf();

  return (
    <AppShell>
      <main className="flex-1 px-5 sm:px-8 lg:px-12 py-8 lg:py-12">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-sans tracking-tight">
            Your library
          </h1>
          <p className="mt-2 text-base font-semibold text-zinc-600">
            {loading
              ? "Loading your shelf…"
              : books.length === 0
                ? "Nothing saved yet."
                : `${books.length} book${books.length === 1 ? "" : "s"} saved.`}
          </p>
        </header>

        {loading ? (
          <div className="flex flex-wrap gap-6">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="w-40 sm:w-48 lg:w-52 animate-pulse">
                <div className="w-full aspect-[2/3] bg-zinc-200 border-2 border-black pop" />
                <div className="h-4 bg-zinc-200 rounded mt-4 w-3/4" />
                <div className="h-3 bg-zinc-200 rounded mt-2 w-1/2" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="max-w-lg bg-stone-50 edge pop p-8 flex flex-col gap-4">
            <span className="w-12 h-12 rounded-lg bg-brand-soft edge pop-sm inline-flex items-center justify-center">
              <LibraryIcon className="w-6 h-6 text-black" aria-hidden />
            </span>
            <h2 className="text-2xl font-bold font-sans">Your shelf is empty</h2>
            <p className="text-base font-semibold text-zinc-600 leading-relaxed">
              Tap the heart on any book to save it here. Your shelf is also what
              Semantica reads to sharpen your recommendations.
            </p>
            <Link
              href="/home"
              className="self-start h-11 px-6 rounded-lg bg-brand text-white edge pop press inline-flex items-center text-base font-semibold font-sans"
            >
              Find something to read
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 sm:gap-8">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={{
                  id: normalizeWorkKey(book.open_library_key),
                  title: book.title,
                  author: book.author,
                  coverUrl: book.cover_url,
                  openLibraryKey: book.open_library_key,
                }}
                size="lg"
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
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
