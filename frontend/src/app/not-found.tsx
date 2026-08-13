import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <Link href="/" aria-label="Semantica home">
        <Logo size={40} withWordmark />
      </Link>

      <div className="bg-white edge pop-lg p-8 sm:p-10 max-w-lg flex flex-col gap-4">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-brand-strong">Error 404</p>
        <h1 className="font-sans font-bold text-3xl sm:text-4xl tracking-tight">
          This page isn&apos;t on the shelf
        </h1>
        <p className="text-base font-semibold text-zinc-600 leading-relaxed">
          The link may be out of date, or the book may never have been catalogued here.
        </p>
        <div className="flex flex-wrap gap-3 justify-center pt-1">
          <Link
            href="/home"
            className="h-11 px-6 rounded-lg bg-brand text-white edge pop press inline-flex items-center text-base font-semibold font-sans"
          >
            Browse books
          </Link>
          <Link
            href="/"
            className="h-11 px-6 rounded-lg bg-white text-black edge pop press inline-flex items-center text-base font-semibold font-sans"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
