"use client";

import { useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <Link href="/" aria-label="Semantica home">
        <Logo size={40} withWordmark />
      </Link>

      <div className="bg-white edge pop-lg p-8 sm:p-10 max-w-lg flex flex-col gap-4">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-brand-strong">
          Something broke
        </p>
        <h1 className="font-sans font-bold text-3xl sm:text-4xl tracking-tight">
          We dropped the book
        </h1>
        <p className="text-base font-semibold text-zinc-600 leading-relaxed">
          An unexpected error stopped this page from loading. Trying again usually works.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-zinc-400">Reference: {error.digest}</p>
        )}
        <div className="flex flex-wrap gap-3 justify-center pt-1">
          <button
            type="button"
            onClick={reset}
            className="h-11 px-6 rounded-lg bg-brand text-white edge pop press inline-flex items-center text-base font-semibold font-sans cursor-pointer"
          >
            Try again
          </button>
          <Link
            href="/home"
            className="h-11 px-6 rounded-lg bg-white text-black edge pop press inline-flex items-center text-base font-semibold font-sans"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    </main>
  );
}
