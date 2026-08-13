"use client";

import { useSyncExternalStore } from "react";
import type { BookPlaylist, PlaylistTrack } from "@/lib/api";

/**
 * What the player bar is currently showing.
 *
 * Kept in a module-level store rather than page state so the bar survives
 * navigation between the Soundtracks index and a playlist detail page.
 */
export interface NowPlaying {
  bookId: number;
  bookTitle: string;
  accentColor: string;
  chapterIndex: number;
  chapterTitle: string;
  chapterCount: number;
  moodLabel: string;
  track: PlaylistTrack | null;
}

let current: NowPlaying | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setNowPlaying(next: NowPlaying | null) {
  current = next;
  emit();
}

/**
 * Start a playlist from a given chapter (defaults to the first), picking that
 * chapter's opening track.
 */
export function playPlaylist(playlist: BookPlaylist, chapterIndex?: number) {
  const chapter =
    playlist.chapters.find((c) => c.chapter_index === chapterIndex) ?? playlist.chapters[0];

  setNowPlaying({
    bookId: playlist.book_id,
    bookTitle: playlist.book_title,
    accentColor: playlist.accent_color,
    chapterIndex: chapter?.chapter_index ?? 0,
    chapterTitle: chapter?.title ?? "",
    chapterCount: playlist.chapter_count ?? playlist.chapters.length,
    moodLabel: chapter?.mood.mood_label ?? "",
    track: chapter?.tracks[0] ?? playlist.tracks[0] ?? null,
  });
}

/** Play one specific track, keeping the chapter context it belongs to. */
export function playTrack(
  playlist: BookPlaylist,
  track: PlaylistTrack,
  chapterIndex: number,
  chapterTitle: string,
  moodLabel: string
) {
  setNowPlaying({
    bookId: playlist.book_id,
    bookTitle: playlist.book_title,
    accentColor: playlist.accent_color,
    chapterIndex,
    chapterTitle,
    chapterCount: playlist.chapter_count ?? playlist.chapters.length,
    moodLabel,
    track,
  });
}

export function useNowPlaying(): NowPlaying | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null
  );
}
