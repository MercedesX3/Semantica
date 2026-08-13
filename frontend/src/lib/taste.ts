"use client";

/**
 * The reading profile collected during onboarding.
 *
 * Onboarding previously walked the user through six screens and then threw
 * every answer away on the final "Finish" click. Persisting it here means the
 * Reading DNA strip on Browse and the profile page show what the reader
 * actually said, rather than a fixed list of five genres.
 */

const KEY = "semantica.taste.v1";

export interface TasteProfile {
  favouriteBooks: { key: string; title: string; author: string; cover_url: string | null }[];
  dislikedBooks: { key: string; title: string; author: string; cover_url: string | null }[];
  genres: string[];
  moods: string[];
  storyPrefs: string[];
  emotions: string[];
  completedAt: string;
}

export function readTasteProfile(): TasteProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TasteProfile;
    return parsed && Array.isArray(parsed.genres) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeTasteProfile(profile: Omit<TasteProfile, "completedAt">) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ ...profile, completedAt: new Date().toISOString() })
    );
  } catch {
    // non-fatal — the session still works, the profile just isn't remembered
  }
}

export function clearTasteProfile() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // non-fatal
  }
}
