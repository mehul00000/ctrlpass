"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Heart, History, Play } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "@/components/PageHeader";
import { MediaCard } from "@/components/MediaCard";
import { ProgressLinkCard } from "@/components/ProgressLinkCard";
import { CardSkeleton } from "@/components/MediaCard";
import { EmptyMyList, EmptyState } from "@/components/States";
import { useContinueWatching, useFavorites, useWatchlistSet } from "@/lib/store-hooks";
import { useCurrentUser } from "@/lib/user-context";
import type { MediaItem } from "@/lib/tmdb-types";
import type { StoreItem } from "@/lib/persistence";

const TABS = [
  { key: "list", label: "My List", icon: Bookmark },
  { key: "favorites", label: "Favorites", icon: Heart },
  { key: "continue", label: "Continue Watching", icon: Play },
] as const;

function toMedia(item: StoreItem): MediaItem {
  return {
    id: item.tmdbId,
    mediaType: item.mediaType,
    title: item.title,
    originalTitle: item.title,
    overview: "",
    posterPath: item.posterPath,
    backdropPath: item.backdropPath ?? null,
    voteAverage: 0,
    voteCount: 0,
    releaseDate: null,
    genreIds: [],
    originalLanguage: "",
  };
}

export default function MyListPage() {
  const { user } = useCurrentUser();
  const watchlist = useWatchlistSet();
  const favorites = useFavorites();
  const continueWatching = useContinueWatching();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("list");
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all");

  const listItems = tab === "list" ? watchlist.items : tab === "favorites" ? favorites.items : [];
  const loading =
    (tab === "list" && watchlist.items === undefined) ||
    (tab === "favorites" && favorites.items === undefined);

  const items: StoreItem[] = listItems ?? [];
  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.mediaType === filter)),
    [items, filter]
  );

  return (
    <>
      <PageHeader
        eyebrow="Your Library"
        title="My List"
        description={
          user.signedIn
            ? "Synced to your account via Convex — available on every device."
            : "Browsing as a guest. Sign in to sync your list across devices."
        }
      />

      <div className="container-page py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  tab === t.key
                    ? "bg-brand text-white shadow-glow"
                    : "bg-white/5 text-neutral-300 hover:bg-white/10"
                )}
              >
                <t.icon className="h-4 w-4" /> {t.label}
                {t.key === "list" && (watchlist.items?.length ?? 0) > 0 && (
                  <span className="rounded-full bg-white/20 px-1.5 text-xs">{watchlist.items.length}</span>
                )}
                {t.key === "favorites" && (favorites.items?.length ?? 0) > 0 && (
                  <span className="rounded-full bg-white/20 px-1.5 text-xs">{favorites.items.length}</span>
                )}
              </button>
            ))}
          </div>

          {(tab === "list" || tab === "favorites") && (
            <div className="flex overflow-hidden rounded-full border border-white/10">
              {(["all", "movie", "tv"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    "px-4 py-1.5 text-sm font-medium transition-colors",
                    filter === f ? "bg-brand text-white" : "text-neutral-300 hover:bg-white/5"
                  )}
                >
                  {f === "all" ? "All" : f === "movie" ? "Movies" : "TV Shows"}
                </button>
              ))}
            </div>
          )}
        </div>

        {tab === "continue" ? (
          continueWatching.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {continueWatching.items.map((h) => (
                <div key={`${h.mediaType}-${h.tmdbId}`} className="[&>a]:w-full">
                  <ProgressLinkCard entry={h} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="Nothing in progress"
              description="Start watching a movie or show and it will appear here with your progress."
              actionLabel="Browse Movies"
              actionHref="/movies"
            />
          )
        ) : loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 tv:grid-cols-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 tv:grid-cols-8">
            {filtered.map((item) => (
              <MediaCard key={`${item.mediaType}-${item.tmdbId}`} item={toMedia(item)} showMediaType />
            ))}
          </div>
        ) : (
          <EmptyMyList />
        )}

        {tab === "list" && filtered.length > 0 && (
          <p className="mt-8 text-center text-xs text-neutral-500">
            Sorted by date added · <Link href="/movies" className="text-brand-peach hover:text-white">find more to watch</Link>
          </p>
        )}
      </div>
    </>
  );
}
