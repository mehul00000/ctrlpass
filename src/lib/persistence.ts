"use client";

// ---------------------------------------------------------------------------
// Shared types + local-only helpers (search history).
//
// User data (watchlists, favorites, watch history, reviews, reports) lives in
// Convex — see convex/userData.ts and src/lib/store-hooks.ts.
// ---------------------------------------------------------------------------

export type MediaType = "movie" | "tv";

export interface StoreItem {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath?: string | null;
  addedAt?: number;
}

export interface HistoryItem {
  _id?: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath?: string | null;
  progress: number;
  duration: number;
  completed: boolean;
  seasonNumber?: number;
  episodeNumber?: number;
  lastWatchedAt: number;
}

export interface ReviewItem {
  _id?: string;
  tmdbId: number;
  mediaType: MediaType;
  userId: string;
  userName: string;
  rating: number;
  reviewText: string;
  createdAt: number;
}

export interface ReportItem {
  tmdbId: number;
  mediaType: MediaType;
  issueType: "playback" | "metadata" | "other";
  description: string;
}

// --- search history (local only by design — private and ephemeral) ----------

export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("ctrlpass:search-history") ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string): void {
  if (typeof window === "undefined") return;
  const q = query.trim();
  if (!q) return;
  const items = [q, ...getSearchHistory().filter((i) => i.toLowerCase() !== q.toLowerCase())].slice(0, 10);
  window.localStorage.setItem("ctrlpass:search-history", JSON.stringify(items));
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("ctrlpass:search-history");
}
