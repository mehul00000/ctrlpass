"use client";

// ---------------------------------------------------------------------------
// Client data hooks — powered by Convex with the Clerk session (official
// integration). useQuery/useMutation subscriptions keep every consumer in
// sync automatically; all user-data functions enforce ownership server-side
// via the verified Clerk identity.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { addSearchHistory, clearSearchHistory, getSearchHistory, type HistoryItem, type MediaType, type StoreItem } from "./persistence";
import { useCurrentUser } from "./user-context";

export function toConvexArgs(item: StoreItem) {
  return {
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
    title: item.title,
    posterPath: item.posterPath ?? null,
    backdropPath: item.backdropPath ?? null,
  };
}

export function toStoreItem(item: {
  id?: number;
  tmdbId?: number;
  mediaType: MediaType;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
}) {
  return {
    tmdbId: item.tmdbId ?? item.id ?? 0,
    mediaType: item.mediaType,
    title: item.title,
    posterPath: item.posterPath ?? null,
    backdropPath: item.backdropPath ?? null,
  };
}

export function useWatchlistSet() {
  const { user } = useCurrentUser();
  const items = (useQuery(api.userData.listWatchlist, user.signedIn ? {} : "skip") ?? []) as StoreItem[];
  const toggleMutation = useMutation(api.userData.toggleWatchlist);

  const has = useCallback(
    (mediaType: MediaType, tmdbId: number) =>
      items.some((i: any) => i.tmdbId === tmdbId && i.mediaType === mediaType),
    [items]
  );

  const toggleItem = useCallback(
    async (item: StoreItem) =>
      await toggleMutation(toConvexArgs(item)),
    [toggleMutation]
  );

  return { items, has, toggleItem };
}

export function useIsWatchlisted(mediaType: MediaType, tmdbId: number) {
  const { has, toggleItem } = useWatchlistSet();
  return { inList: has(mediaType, tmdbId), toggle: toggleItem };
}

export function useFavorites() {
  const { user } = useCurrentUser();
  const items = (useQuery(api.userData.listFavorites, user.signedIn ? {} : "skip") ?? []) as StoreItem[];
  const toggleMutation = useMutation(api.userData.toggleFavorite);

  const toggle = useCallback(
    async (item: StoreItem) => await toggleMutation(toConvexArgs(item)),
    [toggleMutation]
  );

  return { items, toggle };
}

export function useIsFavorite(mediaType: MediaType, tmdbId: number) {
  const { items, toggle } = useFavorites();
  const isFav = items.some((i: any) => i.tmdbId === tmdbId && i.mediaType === mediaType);
  return { isFav, toggle };
}

export function useHistory() {
  const { user } = useCurrentUser();
  const result = useQuery(api.userData.listHistory, user.signedIn ? {} : "skip");
  const items = (result ?? []) as HistoryItem[];
  return { items, loading: result === undefined };
}

export function useContinueWatching() {
  const { items, loading } = useHistory();
  const continueWatching = (items as any[]).filter(
    (i) => !i.completed && i.progress > 15 && i.duration > 0 && i.progress / i.duration < 0.96
  );
  return { items: continueWatching, loading };
}

export function useSearchHistory() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    setItems(getSearchHistory());
  }, []);

  const add = useCallback((q: string) => {
    addSearchHistory(q);
    setItems(getSearchHistory());
  }, []);

  const clear = useCallback(() => {
    clearSearchHistory();
    setItems([]);
  }, []);

  return { items, add, clear };
}
