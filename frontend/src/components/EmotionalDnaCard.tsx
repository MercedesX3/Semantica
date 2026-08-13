"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { getAnalysisJob, getBookDNA, ingestBookPdf, BookDNA } from "@/lib/api";

const W = 500;
const H = 96;
const MID = H * 0.55;

type Phase =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "analysing"; jobId: number; stage: string | null }
  | { kind: "error"; message: string };

/** How often to ask the backend whether the DNA pipeline has finished. */
const POLL_MS = 3000;

function pacingLabel(pacing: number): string {
  if (pacing >= 70) return "FAST";
  if (pacing >= 40) return "MODERATE";
  return "SLOW-BURN";
}

/**
 * The Emotional DNA panel.
 *
 * Renders a book's measured sentiment arc, pacing, and themes when analysis
 * exists. When it doesn't, it offers a PDF upload that runs the book through
 * the ingest + DNA pipeline, and shows progress until the results land.
 * It never invents a profile for an un-analysed book.
 */
export default function EmotionalDnaCard({
  dna,
  bookTitle,
  bookAuthor,
  onAnalysed,
}: {
  dna: BookDNA | null;
  bookTitle: string;
  bookAuthor: string;
  /** Fires when a freshly uploaded book finishes analysis. */
  onAnalysed: (bookId: number, dna: BookDNA) => void;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);
  const bookIdRef = useRef<number | null>(null);

  const points = useMemo(() => {
    const series = dna?.arc.sentiment_series ?? [];
    if (series.length === 0) return "";
    return series
      .map((value, i) => {
        const x = series.length > 1 ? (i / (series.length - 1)) * W : W / 2;
        // sentiment runs -1..1; map onto the plot height
        const y = H - ((value + 1) / 2) * H;
        return `${x},${y}`;
      })
      .join(" ");
  }, [dna]);

  // Poll the background pipeline once an upload has been accepted.
  useEffect(() => {
    if (phase.kind !== "analysing") return;
    let cancelled = false;

    const timer = window.setInterval(async () => {
      try {
        const job = await getAnalysisJob(phase.jobId);
        if (cancelled) return;

        if (job.status === "failed") {
          setPhase({ kind: "error", message: job.error ?? "Analysis failed." });
          return;
        }
        if (job.status !== "completed") {
          if (job.stage !== phase.stage) {
            setPhase({ kind: "analysing", jobId: phase.jobId, stage: job.stage });
          }
          return;
        }

        const bookId = bookIdRef.current ?? job.book_id;
        const fresh = await getBookDNA(bookId);
        if (cancelled) return;
        if (fresh) {
          onAnalysed(bookId, fresh);
          setPhase({ kind: "idle" });
        } else {
          setPhase({ kind: "error", message: "Analysis finished but no DNA was produced." });
        }
      } catch {
        // A single failed poll isn't fatal — the next tick retries.
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [phase, onAnalysed]);

  async function handleFile(file: File) {
    setPhase({ kind: "uploading" });
    try {
      const result = await ingestBookPdf(file, bookTitle, bookAuthor);
      bookIdRef.current = result.id;
      setPhase({ kind: "analysing", jobId: result.analysis_job_id, stage: null });
    } catch (error) {
      setPhase({
        kind: "error",
        message: error instanceof Error ? error.message : "Upload failed.",
      });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ── Analysed: the real chart ──────────────────────────────────────
  if (dna) {
    const pacing = Math.round(dna.style_profile.avg_pacing * 100);
    const themes = dna.theme_profile.top.map((t) => t.theme);

    return (
      <Shell>
        <Header />

        <div className="relative w-full" style={{ height: H }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-full"
            preserveAspectRatio="none"
            role="img"
            aria-label={`Sentiment arc: ${dna.emotion_profile.beginning_emotion} at the start, ${dna.emotion_profile.middle_emotion} in the middle, ${dna.emotion_profile.end_emotion} by the end.`}
          >
            <line
              x1="0"
              y1={MID}
              x2={W}
              y2={MID}
              stroke="#a3a3a3"
              strokeWidth="2.5"
              strokeDasharray="9 5"
            />
            <polyline
              points={points}
              fill="none"
              stroke="var(--brand)"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs font-bold font-mono">
          <span>BEGINNING</span>
          <span className="font-medium text-zinc-500 uppercase tracking-wide truncate">
            {dna.emotion_profile.arc_label}
          </span>
          <span>END</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold font-mono shrink-0">PACING</span>
          <div className="flex-1 h-7 rounded-sm edge-thin flex overflow-hidden">
            <div
              className="bg-red-500 h-full"
              style={{ width: `${Math.max(0, Math.min(100, pacing))}%` }}
            />
            <div className="bg-white flex-1 h-full" />
          </div>
          <span className="text-sm font-semibold font-mono shrink-0">{pacingLabel(pacing)}</span>
        </div>

        {themes.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {themes.map((theme) => (
              <span
                key={theme}
                className="h-8 px-4 bg-white rounded-md edge pop text-sm font-semibold font-mono inline-flex items-center"
              >
                {theme}
              </span>
            ))}
          </div>
        )}
      </Shell>
    );
  }

  // ── Working ───────────────────────────────────────────────────────
  if (phase.kind === "uploading" || phase.kind === "analysing") {
    const isUpload = phase.kind === "uploading";
    return (
      <Shell>
        <Header />
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand" aria-hidden />
          <p className="text-base font-bold font-sans" role="status" aria-live="polite">
            {isUpload ? "Reading the book…" : "Building the emotional DNA…"}
          </p>
          <p className="text-sm font-semibold font-sans text-zinc-600 max-w-xs">
            {isUpload
              ? "Extracting text and embedding every passage. A full novel takes a few minutes."
              : stageCopy(phase.stage)}
          </p>
          <div className="mt-1 flex gap-1.5" aria-hidden>
            {["analysis", "themes", "dna"].map((s) => {
              const active = !isUpload && phase.stage === s;
              const done =
                !isUpload &&
                phase.stage != null &&
                ["analysis", "themes", "dna"].indexOf(phase.stage) >
                  ["analysis", "themes", "dna"].indexOf(s);
              return (
                <span
                  key={s}
                  className={`h-1.5 w-10 rounded-full transition-colors ${
                    done ? "bg-brand" : active ? "bg-brand animate-pulse" : "bg-zinc-200"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </Shell>
    );
  }

  // ── Not analysed yet ──────────────────────────────────────────────
  return (
    <Shell>
      <Header />

      {phase.kind === "error" && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border-2 border-red-500 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          {phase.message}
        </p>
      )}

      <p className="text-sm font-semibold font-sans text-zinc-600 leading-relaxed">
        Sentiment arc, pacing, and themes are measured from the book&apos;s full
        text. Upload a PDF of <span className="font-bold">{bookTitle}</span> and
        Semantica will read it and build its emotional DNA.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="self-start h-11 px-6 rounded-lg bg-brand text-white edge pop press inline-flex items-center gap-2 text-base font-semibold font-sans cursor-pointer"
      >
        <Upload className="w-4 h-4" aria-hidden />
        {phase.kind === "error" ? "Try another PDF" : "Upload PDF"}
      </button>

      <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">
        PDF with selectable text · max 40MB
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-stone-50 pop-lg edge-thin p-4 flex flex-col gap-3">{children}</div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <span className="text-base font-semibold font-sans">Emotional DNA</span>
      <span className="flex items-center gap-2 text-xs font-medium font-mono text-zinc-500 uppercase tracking-wide">
        <span>Sentiment arc</span>
        <span className="w-1 h-1 bg-black rounded-full" aria-hidden />
        <span>Pacing</span>
        <span className="w-1 h-1 bg-black rounded-full" aria-hidden />
        <span>Themes</span>
      </span>
    </div>
  );
}

function stageCopy(stage: string | null): string {
  switch (stage) {
    case "analysis":
      return "Scoring every passage for emotion, intensity, and pacing.";
    case "themes":
      return "Working out what the book keeps coming back to.";
    case "dna":
      return "Folding it all into one profile.";
    default:
      return "Queued — starting shortly.";
  }
}
