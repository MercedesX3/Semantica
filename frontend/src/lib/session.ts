"use client";

import { getCurrentUser, logoutUser, User } from "./api";

/**
 * Client-side session state.
 *
 * The real auth cookie is HttpOnly and set by the API on a different origin,
 * so Next middleware can't read it — the backend stays the source of truth for
 * anything that actually matters. What's cached here is only used to decide
 * what the UI shows (greeting, nav state, whether to bounce to /login).
 */

const PROFILE_KEY = "semantica.user.v1";

export type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; user: User }
  | { status: "anonymous" }
  /** API unreachable — we can't prove either way, so don't lock anyone out. */
  | { status: "offline"; user: User | null };

export function readCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function cacheUser(user: User | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) window.localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    // non-fatal
  }
}

export async function resolveSession(): Promise<SessionState> {
  try {
    const user = await getCurrentUser();
    cacheUser(user);
    return { status: "authenticated", user };
  } catch (error) {
    // A 401 comes back as a thrown Error with the API's message; a dead
    // backend comes back as a TypeError from fetch itself. Only the former
    // proves the visitor is signed out.
    const isNetworkFailure = error instanceof TypeError || (error as Error)?.name === "AbortError";
    if (isNetworkFailure) {
      return { status: "offline", user: readCachedUser() };
    }
    cacheUser(null);
    return { status: "anonymous" };
  }
}

export async function signOut() {
  cacheUser(null);
  try {
    await logoutUser();
  } catch {
    // The local session is cleared regardless.
  }
}

export function displayName(user: User | null): string {
  if (!user) return "Reader";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || user.email;
}

export function initials(user: User | null): string {
  if (!user) return "R";
  const first = user.first_name?.[0] ?? "";
  const last = user.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || user.email[0]?.toUpperCase() || "R";
}
