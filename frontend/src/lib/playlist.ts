import type { BookPlaylist, PlaylistTrack } from "./api";

/** Fallback accent when the API doesn't supply one, matching the design. */
export const ACCENT_FALLBACK = "#1d4ed8";

/**
 * The API sends `accent_color` as a Tailwind class name ("bg-violet-600").
 * Tailwind v4 only emits classes it can see in the source at build time, so a
 * class arriving from data produces no CSS at all — the card rendered as white
 * text on a white block. Resolve to a literal colour and apply it inline.
 */
const ACCENT_HEX: Record<string, string> = {
  "bg-violet-600": "#7c3aed",
  "bg-violet-500": "#8b5cf6",
  "bg-blue-700": "#1d4ed8",
  "bg-blue-600": "#2563eb",
  "bg-indigo-600": "#4f46e5",
  "bg-sky-500": "#0ea5e9",
  "bg-emerald-600": "#059669",
  "bg-red-500": "#ef4444",
  "bg-orange-500": "#f97316",
  "bg-amber-500": "#f59e0b",
  "bg-pink-500": "#ec4899",
  "bg-teal-500": "#14b8a6",
};

/** Resolve an API accent value to a CSS colour usable in a style attribute. */
export function accentColor(accent?: string | null): string {
  if (!accent) return ACCENT_FALLBACK;
  // Already a literal colour (hex / rgb / named)?
  if (/^(#|rgb|hsl)/.test(accent)) return accent;
  return ACCENT_HEX[accent] ?? ACCENT_FALLBACK;
}

/** 320000 → "5:20" */
export function formatTrackTime(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return "—";
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export interface TrackRow {
  key: string;
  position: number;
  track: PlaylistTrack;
  chapterIndex: number;
  /** e.g. "CH. 1 JOAN AT THE TELESCOPE" — null when we can't attribute it. */
  chapterLabel: string | null;
  chapterTitle: string;
  moodLabel: string;
}

/**
 * Flatten a playlist into numbered rows that each know which chapter they were
 * matched to. Built from `chapters` so the "matched to" column is real; falls
 * back to the flat `tracks` array (unattributed) if chapters are missing.
 */
export function buildTrackRows(playlist: BookPlaylist): TrackRow[] {
  if (playlist.chapters.length > 0) {
    const rows: TrackRow[] = [];
    for (const chapter of playlist.chapters) {
      for (const track of chapter.tracks) {
        rows.push({
          key: `${chapter.chapter_index}-${track.id ?? track.name}-${rows.length}`,
          position: rows.length + 1,
          track,
          chapterIndex: chapter.chapter_index,
          chapterLabel: `CH. ${chapter.chapter_index + 1} ${chapter.title}`.toUpperCase(),
          chapterTitle: chapter.title,
          moodLabel: chapter.mood.mood_label,
        });
      }
    }
    if (rows.length > 0) return rows;
  }

  return playlist.tracks.map((track, i) => ({
    key: `${track.id ?? track.name}-${i}`,
    position: i + 1,
    track,
    chapterIndex: 0,
    chapterLabel: null,
    chapterTitle: "",
    moodLabel: "",
  }));
}
