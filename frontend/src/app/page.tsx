"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Activity, Dna, Music4 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import BookSearch from "@/components/BookSearch";

const FEATURES = [
  {
    icon: Compass,
    title: "Search by feeling",
    accent: "bg-pink-200",
    description:
      "Ask for “quietly devastating”, “found family”, or “dread that builds slowly”. Semantica reads meaning, not keywords, so you don't have to know the title you're looking for.",
  },
  {
    icon: Activity,
    title: "Emotional DNA",
    accent: "bg-amber-400",
    description:
      "Every book gets a sentiment arc, a pacing score, and its dominant themes — so you can see whether a story is a slow burn or a sprint before you commit 400 pages to it.",
  },
  {
    icon: Dna,
    title: "Your reading profile",
    accent: "bg-emerald-300",
    description:
      "Tell us six things about how you like to read. We build a taste profile from it and match new books against the shape of what you already love.",
  },
  {
    icon: Music4,
    title: "Book soundtracks",
    accent: "bg-sky-500",
    description:
      "Each chapter's mood becomes a run of tracks, so the music shifts as the story does. In beta while we finish tuning the chapter sync.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Tell us what you love",
    body: "Pick a handful of books you'd re-read, a few you bounced off, and the moods you're drawn to.",
  },
  {
    n: "02",
    title: "We read the books",
    body: "Every story is split into passages and mapped into a shared meaning space, then scored for emotion, pacing, and theme.",
  },
  {
    n: "03",
    title: "Get matches that fit",
    body: "We compare the shape of your taste against the shape of each book — not its genre label — and show you why each match landed.",
  },
];

export default function Home() {
  const [showSplash, setShowSplash] = useState(false);

  // Splash runs once per browser session, and never for people who've asked
  // for reduced motion.
  useEffect(() => {
    const seen = window.sessionStorage.getItem("semantica.splash");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!seen && !reduced) {
      setShowSplash(true);
      window.sessionStorage.setItem("semantica.splash", "1");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showSplash && <LoadingScreen onComplete={() => setShowSplash(false)} />}

      <Header />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/BG Faded Circle.svg"
            alt=""
            aria-hidden
            className="hidden lg:block pointer-events-none select-none absolute -left-72 -top-32 w-[30rem] max-w-none opacity-55 z-0"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/BG Faded Circle.svg"
            alt=""
            aria-hidden
            className="hidden lg:block pointer-events-none select-none absolute -right-72 top-0 w-[30rem] max-w-none opacity-55 scale-x-[-1] z-0"
          />

          <div className="relative z-10 max-w-3xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 flex flex-col items-center text-center gap-6">
            <span className="inline-flex items-center gap-2 h-8 px-4 rounded-md bg-white edge pop-sm text-xs font-mono uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-brand" aria-hidden />
              Semantic book discovery
            </span>

            <h1 className="font-sans font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-balance">
              Find your next book by how it{" "}
              <span className="font-serif italic font-medium text-brand-strong">makes you feel</span>
            </h1>

            <p className="text-lg sm:text-xl font-semibold text-zinc-600 max-w-xl text-balance">
              Semantica reads the emotional DNA of a story and matches you on mood, pacing,
              and theme — not just the genre printed on the spine.
            </p>

            <div className="w-full max-w-md mt-2">
              <BookSearch placeholder="Try “The Night Circus”…" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <Link
                href="/signup"
                className="h-11 px-7 rounded-lg bg-brand text-white edge pop press inline-flex items-center text-base sm:text-lg font-semibold font-sans"
              >
                Build my reading profile
              </Link>
              <a
                href="#how-it-works"
                className="h-11 px-7 rounded-lg bg-white text-black edge pop press inline-flex items-center text-base sm:text-lg font-semibold font-sans"
              >
                How it works
              </a>
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section id="how-it-works" className="scroll-mt-28 px-6 py-16 sm:py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-sans font-bold text-3xl sm:text-4xl tracking-tight mb-3">
              How it works
            </h2>
            <p className="text-lg font-semibold text-zinc-600 mb-10 max-w-2xl">
              Three steps, and none of them are “browse a genre page and hope”.
            </p>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STEPS.map(({ n, title, body }) => (
                <li key={n} className="bg-white edge pop p-6 flex flex-col gap-3">
                  <span className="font-mono text-sm font-semibold text-brand-strong">{n}</span>
                  <h3 className="font-sans font-bold text-xl leading-tight">{title}</h3>
                  <p className="text-sm font-semibold text-zinc-600 leading-relaxed">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────── */}
        <section id="features" className="scroll-mt-28 px-6 py-16 sm:py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-sans font-bold text-3xl sm:text-4xl tracking-tight mb-3">
              What you get
            </h2>
            <p className="text-lg font-semibold text-zinc-600 mb-10 max-w-2xl">
              Everything here works on the shape of a story, not its blurb.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {FEATURES.map(({ icon: Icon, title, description, accent }) => (
                <div key={title} className="bg-white edge pop p-6 flex flex-col gap-3">
                  <span
                    className={`w-11 h-11 ${accent} rounded-lg edge pop-sm inline-flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5 text-black" strokeWidth={2} aria-hidden />
                  </span>
                  <h3 className="font-sans font-bold text-xl leading-tight">{title}</h3>
                  <p className="text-sm font-semibold text-zinc-600 leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Closing CTA ──────────────────────────────────────── */}
        <section className="px-6 pt-4 pb-8">
          <div className="max-w-5xl mx-auto bg-brand edge pop-lg px-6 sm:px-10 py-12 sm:py-16 flex flex-col items-center text-center gap-5">
            <h2 className="font-sans font-bold text-3xl sm:text-4xl text-white tracking-tight text-balance max-w-2xl">
              Six questions. Then a shelf that actually sounds like you.
            </h2>
            <p className="text-base sm:text-lg font-semibold text-white/90 max-w-xl text-balance">
              Building your reading profile takes about two minutes.
            </p>
            <Link
              href="/signup"
              className="h-11 px-7 rounded-lg bg-white text-black edge pop press inline-flex items-center text-base sm:text-lg font-semibold font-sans"
            >
              Get started free
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
