"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Plus, Minus, Crosshair } from "lucide-react";
import MapDecor from "./MapDecor";
import BookDetailPanel from "./BookDetailPanel";
import { BOOK_GENOME, GENRE_COLORS } from "@/lib/bookGenome";
import { BookGraphEngine, Layout, Neighbour, textOn } from "@/lib/bookGraph";

const VIEW_CONTROLS = [
  { key: "in" as const, icon: Plus, label: "Zoom in" },
  { key: "out" as const, icon: Minus, label: "Zoom out" },
  { key: "reset" as const, icon: Crosshair, label: "Reset view" },
];

const LAYOUTS: { value: Layout; label: string; hint: string }[] = [
  { value: "web", label: "Web", hint: "Organic similarity web" },
  { value: "orbit", label: "Orbit", hint: "Orbit the selected book" },
  { value: "cluster", label: "Cluster", hint: "Cluster by genre" },
];

export default function BookMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BookGraphEngine | null>(null);

  const [layout, setLayout] = useState<Layout>("web");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightGenre, setHighlightGenre] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState({ nodeCount: 0, linkCount: 0 });
  const [neighbours, setNeighbours] = useState<Neighbour[]>([]);

  // The engine is created once and driven imperatively — it owns the RAF loop,
  // so per-frame state must never round-trip through React.
  useEffect(() => {
    const engine = new BookGraphEngine({
      data: BOOK_GENOME,
      onSelect: (id) => setSelectedId(id),
      onStats: setStats,
    });
    engineRef.current = engine;

    const canvas = canvasRef.current;
    if (canvas) engine.mount(canvas);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setLayout(layout);
  }, [layout]);

  useEffect(() => {
    engineRef.current?.setHighlightGenre(highlightGenre);
  }, [highlightGenre]);

  const onViewControl = useCallback((key: "in" | "out" | "reset") => {
    const engine = engineRef.current;
    if (!engine) return;
    if (key === "in") engine.zoomBy(1.25);
    else if (key === "out") engine.zoomBy(0.8);
    else engine.resetView();
  }, []);

  const selectBook = useCallback((id: string | null) => {
    setSelectedId(id);
    engineRef.current?.select(id);
    setQuery("");
  }, []);

  const selected = useMemo(
    () => (selectedId ? BOOK_GENOME.books.find((b) => b.id === selectedId) ?? null : null),
    [selectedId]
  );

  // Bonds come from the engine's adjacency map, which is imperative state —
  // read it in an effect rather than during render.
  useEffect(() => {
    setNeighbours(selectedId ? engineRef.current?.neighboursOf(selectedId) ?? [] : []);
  }, [selectedId]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return BOOK_GENOME.books
      .filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query]);

  return (
    <div className="relative flex-1 overflow-hidden bg-background">
      <MapDecor />

      <canvas ref={canvasRef} className="absolute inset-0 z-10 block h-full w-full" />

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 p-3 sm:gap-3 sm:p-5">
        {/* Identity + counts */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg bg-stone-50 edge pop px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
          <div>
            <p className="font-sans text-base font-bold leading-none tracking-tight sm:text-lg">
              The Book Map
            </p>
            {/* Tagline is the first thing to go when space is tight */}
            <p className="mt-1 hidden font-mono text-[0.6rem] uppercase tracking-[0.2em] text-zinc-500 sm:block">
              every book has a genome
            </p>
          </div>
          <span className="mx-1 h-8 w-0.5 bg-black" aria-hidden />
          <p className="font-mono text-[0.6rem] leading-relaxed text-zinc-600 sm:text-[0.65rem]">
            {stats.nodeCount} titles
            <br />
            {stats.linkCount} bonds
          </p>
        </div>

        {/* Search */}
        <div className="pointer-events-auto relative order-last w-full max-w-[430px] flex-1 lg:order-none">
          <div className="flex h-11 items-center gap-3 rounded-lg bg-stone-50 edge pop px-3 sm:px-4">
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a title or author…"
              aria-label="Search the map"
              className="min-w-0 flex-1 bg-transparent font-sans text-sm font-semibold outline-none placeholder:text-black/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md bg-black text-white"
              >
                <X className="h-3 w-3" strokeWidth={3} />
              </button>
            )}
          </div>

          {results.length > 0 && (
            <ul className="absolute inset-x-0 top-13 max-h-[min(340px,45vh)] overflow-y-auto rounded-lg border-2 border-black bg-stone-50 pop">
              {results.map((book) => (
                <li key={book.id}>
                  <button
                    type="button"
                    onClick={() => selectBook(book.id)}
                    className="flex w-full cursor-pointer items-center gap-3 border-b-2 border-black/10 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-brand-soft/25"
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border-2 border-black"
                      style={{ backgroundColor: GENRE_COLORS[book.genre] }}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-sans text-sm font-bold">
                        {book.title}
                      </span>
                      <span className="block truncate font-sans text-xs font-semibold text-zinc-600">
                        {book.author}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Layout toggle */}
        <div
          role="group"
          aria-label="Graph layout"
          className="pointer-events-auto flex gap-1 rounded-lg bg-stone-50 edge pop p-1 sm:p-1.5"
        >
          {LAYOUTS.map(({ value, label, hint }) => {
            const active = layout === value;
            return (
              <button
                key={value}
                type="button"
                title={hint}
                aria-pressed={active}
                onClick={() => setLayout(value)}
                className={`cursor-pointer rounded-lg px-2.5 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-wider transition-colors sm:px-3 sm:text-xs ${
                  active ? "bg-brand text-white" : "hover:bg-brand-soft/25"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Genre legend ─────────────────────────────────────── */}
      <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-20 flex gap-2 overflow-x-auto rail rounded-lg bg-stone-50 edge pop p-2 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-[20rem] sm:flex-wrap sm:overflow-visible sm:p-3">
        {Object.entries(GENRE_COLORS).map(([name, color]) => {
          const active = highlightGenre === name;
          const dimmed = highlightGenre !== null && !active;
          return (
            <button
              key={name}
              type="button"
              aria-pressed={active}
              onClick={() => setHighlightGenre(active ? null : name)}
              style={{ backgroundColor: color, color: textOn(color) }}
              // Sized and set like GenreTag so the legend reads as the same
              // chip the rest of the product uses.
              className={`inline-flex h-8 shrink-0 cursor-pointer items-center rounded-md px-4 font-mono text-sm font-semibold edge transition-all ${
                active ? "pop" : "pop-sm"
              } ${dimmed ? "opacity-40" : "opacity-100"}`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* ── Zoom controls ────────────────────────────────────── */}
      <div className="pointer-events-auto absolute bottom-20 right-3 z-20 flex flex-col gap-1.5 sm:bottom-4 sm:right-4">
        {VIEW_CONTROLS.map(({ icon: Icon, label, key }) => (
          <button
            key={label}
            type="button"
            onClick={() => onViewControl(key)}
            aria-label={label}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-stone-50 edge pop press"
          >
            <Icon className="h-4 w-4" strokeWidth={2.5} />
          </button>
        ))}
      </div>

      {/* ── Hint ─────────────────────────────────────────────── */}
      {!selected && (
        <p className="pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-amber-400 edge pop px-5 py-2 font-mono text-[0.7rem] uppercase tracking-wider lg:block">
          drag to roam &nbsp;·&nbsp; scroll to zoom &nbsp;·&nbsp; click a cell to read its genome
        </p>
      )}

      {/* ── Detail panel ─────────────────────────────────────── */}
      {selected && (
        <BookDetailPanel
          book={selected}
          color={GENRE_COLORS[selected.genre] ?? "#9ca3af"}
          neighbours={neighbours}
          onClose={() => selectBook(null)}
          onSelect={selectBook}
        />
      )}
    </div>
  );
}
