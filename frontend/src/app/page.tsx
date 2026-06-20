"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";

const FEATURES = [
  {
    title: "Semantic Search",
    description:
      "Find passages by meaning, theme, or emotion — not just exact keywords. Powered by sentence embeddings.",
  },
  {
    title: "Chunk Visualization",
    description:
      "See how a book's themes shift from beginning to end with a PCA-reduced scatter plot of every chunk.",
  },
  {
    title: "Emotion & Pacing Analysis",
    description:
      "Every chunk is scored for dominant emotion, intensity, pacing, and dialogue density — revealing a book's narrative arc.",
  },
  {
    title: "Drag-and-Drop Ingestion",
    description:
      "Drop in any .txt file and Semantica chunks, embeds, and indexes it for search in minutes.",
  },
];

export default function Home() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFCF5]">
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}

      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden min-h-180 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/BG Faded Circle.svg"
            alt=""
            width={513}
            height={712}
            className="pointer-events-none select-none absolute -left-40 top-0 -z-10"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/BG Faded Circle.svg"
            alt=""
            width={504.77}
            height={515.44}
            className="pointer-events-none select-none absolute -right-40 top-0 z-10"
          />

          <img
            src="/BG Faded Circle.svg"
            alt=""
            width={504.77}
            height={515.44}
            className="pointer-events-none select-none absolute -left-40 top-0 z-10 scale-x-[-1]"
          />

          <div className="max-w-4xl mx-auto px-6 py-28 flex flex-col items-center text-center gap-6">
            <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl font-medium text-zinc-900 tracking-tight whitespace-nowrap">
              Find your next book by how it makes you feel
            </h1>
            <p className="text-lg font-semibold text-zinc-500 max-w-xl">
              Semantica reads the emotional DNA of every story to match you with books that resonate not just ones that match a genre
            </p>
            <div className="flex items-center gap-2 border-b-2 border-[#E1367C] mt-2 pb-1">
              <Search className="w-4 h-4 text-[#E1367C]" />
              <input
                type="text"
                placeholder="Search for a book"
                className="bg-transparent outline-none text-sm font-medium font-semibold text-[#E1367C] placeholder-[#E1367C] w-48"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="font-serif italic text-2xl font-bold text-zinc-900 text-center mb-2">Features</h2>
          <p className="text-zinc-500 text-center mb-12">
            Everything you need to explore a book beyond its plot summary.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col gap-2"
              >
                <h3 className="font-serif italic font-semibold text-lg text-zinc-900">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Learn More */}
        <section id="learn-more" className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="font-serif italic text-2xl font-bold text-zinc-900 mb-4">How it works</h2>
          <p className="text-zinc-500 leading-relaxed">
            Each book is split into overlapping chunks and embedded into a
            384-dimensional vector space using a sentence transformer model.
            When you search, your query is embedded the same way, and
            Semantica finds the chunks whose meaning is closest to yours —
            using cosine similarity in PostgreSQL with pgvector. Emotion and
            pacing analysis layers on top, so you can explore not just what a
            book is about, but how it feels.
          </p>
          <Link
            href="/signup"
            className="inline-block mt-8 px-6 py-3 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-700 transition-colors"
          >
            Start Exploring
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
