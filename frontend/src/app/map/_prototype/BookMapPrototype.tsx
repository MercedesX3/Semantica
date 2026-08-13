"use client";

/**
 * PROTOTYPE — not routed.
 *
 * The pan/zoom canvas works, but every book node below is invented. It stays
 * here (inside a private `_prototype` folder, so the App Router ignores it)
 * until the clustering endpoint can supply real embedding coordinates.
 * The live /map route renders a Coming Soon page instead.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/ui/SearchInput";
import GenreTag from "@/components/ui/GenreTag";

interface MapBook {
  id: number;
  title: string;
  author?: string;
  genre: string;
  x: number;
  y: number;
  size: number;
  cluster: "romance" | "dark";
}

const CLUSTER_BOOKS: MapBook[] = [
  { id: 1, title: "Atmosphere", genre: "Romance", x: 22, y: 30, size: 56, cluster: "romance" },
  { id: 2, title: "Atmosphere", genre: "Romance", x: 34, y: 18, size: 56, cluster: "romance" },
  { id: 3, title: "The Hunger Games", genre: "Dystopian", x: 28, y: 52, size: 56, cluster: "romance" },
  { id: 4, title: "Atmosphere", genre: "Romance", x: 16, y: 50, size: 56, cluster: "romance" },
  { id: 5, title: "Atmosphere", genre: "Romance", x: 37, y: 46, size: 56, cluster: "romance" },
  { id: 6, title: "Atmosphere", genre: "Horror", x: 62, y: 60, size: 56, cluster: "dark" },
  { id: 7, title: "Atmosphere", genre: "Dystopian", x: 72, y: 72, size: 64, cluster: "dark" },
  { id: 8, title: "Atmosphere", genre: "Horror", x: 58, y: 74, size: 56, cluster: "dark" },
];

const DETAIL_BOOK = {
  title: "THE HUNGER GAMES",
  author: "Suzanne Collins",
  genre: "Dystopian",
  pages: 384,
  year: 2018,
  genreCount: 6,
  description: "A long description about what the book is. The book is about districts and volunteers. The book is about districts and volunteers.",
  genome: ["Dystopian", "Dystopian", "Dystopian", "Dystopian"],
  sharedDna: [
    { title: "Brave New World", author: "Aldous Hurley", genres: ["Dystopian", "Dystopian"] },
    { title: "Brave New World", author: "Aldous Hurley", genres: ["Dystopian", "Dystopian"] },
  ],
};

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.35;
const MAX_SCALE = 5;
const ZOOM_STEP = 1.3;

export default function BookMapPrototype() {
  const [selected, setSelected] = useState<number | null>(3);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [smoothZoom, setSmoothZoom] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  // Stores the mouse anchor and the pan offset at the moment drag started
  const dragOrigin = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  // ── Wheel zoom (zoom toward cursor) ──────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Normalise delta across trackpads and mouse wheels
    const delta = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
    const factor = Math.pow(0.999, delta);

    setTransform((prev) => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor));
      const ratio = newScale / prev.scale;
      return {
        scale: newScale,
        x: mx - (mx - prev.x) * ratio,
        y: my - (my - prev.y) * ratio,
      };
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // ── Mouse pan ─────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start panning when clicking a book node button
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    const clientX = e.clientX;
    const clientY = e.clientY;
    // Capture current pan via functional update so we always read latest state
    setTransform((current) => {
      dragOrigin.current = { mx: clientX, my: clientY, px: current.x, py: current.y };
      return current;
    });
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragOrigin.current) return;
      const dx = e.clientX - dragOrigin.current.mx;
      const dy = e.clientY - dragOrigin.current.my;
      setTransform((prev) => ({
        ...prev,
        x: dragOrigin.current!.px + dx,
        y: dragOrigin.current!.py + dy,
      }));
    },
    [isDragging],
  );

  const stopDrag = useCallback(() => {
    setIsDragging(false);
    dragOrigin.current = null;
  }, []);

  // ── Button zoom (animated, toward viewport center) ───────────────────────
  const doZoom = useCallback((factor: number) => {
    const container = containerRef.current;
    if (!container) return;
    const cx = container.clientWidth / 2;
    const cy = container.clientHeight / 2;
    setSmoothZoom(true);
    setTransform((prev) => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor));
      const ratio = newScale / prev.scale;
      return {
        scale: newScale,
        x: cx - (cx - prev.x) * ratio,
        y: cy - (cy - prev.y) * ratio,
      };
    });
    // Turn off smooth transition after animation completes
    setTimeout(() => setSmoothZoom(false), 220);
  }, []);

  return (
    <AppShell fixedHeight>
      <div className="flex-1 relative overflow-hidden">

        {/* ── Pinned overlays (not affected by pan/zoom) ────────────────── */}
        <div className="absolute top-4 left-4 z-20 pointer-events-auto">
          <SearchInput containerClassName="w-80" placeholder="Find a book on the map" />
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-6 left-4 z-20 flex flex-col gap-1.5">
          <button
            onClick={() => doZoom(ZOOM_STEP)}
            aria-label="Zoom in"
            className="w-10 h-10 bg-white outline outline-2 outline-offset-[-2px] outline-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => doZoom(1 / ZOOM_STEP)}
            aria-label="Zoom out"
            className="w-10 h-10 bg-white outline outline-2 outline-offset-[-2px] outline-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>

        {/* Selected book detail panel */}
        {selected && (
          <div className="absolute right-4 top-4 w-72 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] outline outline-1 outline-offset-[-1px] outline-black overflow-hidden z-20">
            <div className="bg-red-500 p-4">
              <GenreTag genre={DETAIL_BOOK.genre} size="sm" />
              <h2 className="text-2xl font-bold font-sans text-white mt-2">{DETAIL_BOOK.title}</h2>
              <p className="text-base font-semibold font-sans text-white">{DETAIL_BOOK.author}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm font-semibold font-sans text-white">{DETAIL_BOOK.pages} Pages</span>
                <span className="text-white">|</span>
                <span className="text-sm font-semibold font-sans text-white">{DETAIL_BOOK.year}</span>
                <span className="text-white">|</span>
                <span className="text-sm font-semibold font-sans text-white">{DETAIL_BOOK.genreCount} Genes</span>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <p className="text-sm font-sans text-zinc-500">{DETAIL_BOOK.description}</p>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold font-sans">THE GENOME</span>
                  <div className="flex-1 h-px bg-black" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DETAIL_BOOK.genome.map((g, i) => (
                    <span
                      key={i}
                      className="h-8 px-4 py-1 rounded-md outline-2 -outline-offset-2 outline-black bg-white text-sm font-semibold font-mono inline-flex items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold font-sans">SHARED DNA</span>
                  <div className="flex-1 h-px bg-black" />
                </div>
                <div className="flex flex-col gap-2">
                  {DETAIL_BOOK.sharedDna.map((related, i) => (
                    <div key={i} className="flex items-start gap-2 outline outline-1 outline-offset-[-1px] outline-black p-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-bold font-sans">{related.title}</p>
                        <p className="text-xs font-semibold font-sans text-zinc-500">{related.author}</p>
                        <div className="flex gap-1 mt-1">
                          {related.genres.map((g, j) => (
                            <span
                              key={j}
                              className="h-6 px-3 rounded-md outline-2 -outline-offset-2 outline-black bg-white text-xs font-semibold font-mono inline-flex items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Pannable / zoomable canvas ────────────────────────────────── */}
        <div
          ref={containerRef}
          className={`absolute inset-0 select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: "0 0",
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              willChange: "transform",
              // Instant during drag/wheel; animated for button-triggered zoom
              transition: smoothZoom ? "transform 0.2s ease-out" : "none",
            }}
          >
            {/* Cluster blobs */}
            <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
              <ellipse cx="28" cy="40" rx="22" ry="26" fill="rgba(249,168,212,0.25)" stroke="#ec4899" strokeWidth="0.3" strokeDasharray="1 0.8" />
              <ellipse cx="65" cy="68" rx="18" ry="20" fill="rgba(147,197,253,0.2)" stroke="#3b82f6" strokeWidth="0.3" strokeDasharray="1 0.8" />
            </svg>

            {/* Cluster labels */}
            <div className="absolute" style={{ top: "7%", left: "12%" }}>
              <span className="text-sm font-semibold font-mono text-pink-500">SLOW BURNING LONGING</span>
            </div>
            <div className="absolute" style={{ top: "20%", left: "48%" }}>
              <span className="text-sm font-semibold font-mono text-blue-500">Dark Academia</span>
            </div>
            <div className="absolute" style={{ top: "40%", left: "50%" }}>
              <span className="text-sm font-semibold font-mono text-blue-400">QUIET SPECULAT...</span>
            </div>

            {/* Book nodes */}
            {CLUSTER_BOOKS.map((book) => {
              const isSelected = selected === book.id;
              const isCenter = book.id === 3;
              const bg =
                book.cluster === "romance"
                  ? isCenter
                    ? "bg-pink-500"
                    : "bg-pink-300"
                  : "bg-blue-400";
              const outlineClass = isSelected
                ? "outline-[3px] -outline-offset-[3px] outline-pink-500"
                : "outline-2 -outline-offset-2 outline-black";

              return (
                <button
                  key={book.id}
                  onClick={() => setSelected(book.id === selected ? null : book.id)}
                  className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                  style={{ left: `${book.x}%`, top: `${book.y}%` }}
                >
                  <div
                    className={`rounded-full ${bg} ${outlineClass} flex items-center justify-center`}
                    style={{ width: book.size, height: book.size }}
                  >
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                  <span className="text-xs font-semibold font-sans whitespace-nowrap">{book.title}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
