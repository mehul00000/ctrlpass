"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import clsx from "clsx";
import { MediaCard } from "./MediaCard";
import { CardSkeleton } from "./MediaCard";
import { EmptyState } from "./States";
import type { Genre, MediaItem, Paginated } from "@/lib/tmdb-types";

type Kind = "movie" | "tv" | "anime";

export interface DiscoverTab {
  key: string;
  label: string;
}

const MOVIE_TABS: DiscoverTab[] = [
  { key: "trending", label: "Trending" },
  { key: "popular", label: "Popular" },
  { key: "top-rated", label: "Top Rated" },
  { key: "now-playing", label: "In Cinemas" },
  { key: "upcoming", label: "Upcoming" },
  { key: "latest", label: "Latest Releases" },
  { key: "discover", label: "All + Filters" },
];

const TV_TABS: DiscoverTab[] = [
  { key: "trending", label: "Trending" },
  { key: "popular", label: "Popular" },
  { key: "top-rated", label: "Top Rated" },
  { key: "airing-today", label: "Airing Today" },
  { key: "on-the-air", label: "On The Air" },
  { key: "discover", label: "All + Filters" },
];

const ANIME_TABS: DiscoverTab[] = [
  { key: "series", label: "Anime Series" },
  { key: "movies", label: "Anime Movies" },
  { key: "top", label: "Top Rated" },
];

const MOVIE_SORTS = [
  { key: "popularity.desc", label: "Most Popular" },
  { key: "vote_average.desc", label: "Highest Rated" },
  { key: "primary_release_date.desc", label: "Newest First" },
  { key: "revenue.desc", label: "Box Office" },
  { key: "title.asc", label: "Title A–Z" },
];

const TV_SORTS = [
  { key: "popularity.desc", label: "Most Popular" },
  { key: "vote_average.desc", label: "Highest Rated" },
  { key: "first_air_date.desc", label: "Newest First" },
  { key: "name.asc", label: "Title A–Z" },
];

const LANGUAGES = [
  { key: "", label: "All Languages" },
  { key: "en", label: "English" },
  { key: "ja", label: "Japanese" },
  { key: "ko", label: "Korean" },
  { key: "hi", label: "Hindi" },
  { key: "es", label: "Spanish" },
  { key: "fr", label: "French" },
  { key: "de", label: "German" },
];

const YEARS = ["", String(new Date().getFullYear()), ...Array.from({ length: 54 }, (_, i) => String(new Date().getFullYear() - 1 - i))];
const RATINGS = [
  { key: "", label: "Any Rating" },
  { key: "8", label: "8+ Excellent" },
  { key: "7", label: "7+ Great" },
  { key: "6", label: "6+ Good" },
  { key: "5", label: "5+ OK" },
];

interface Filters {
  genre: string;
  year: string;
  sort: string;
  rating: string;
  lang: string;
}

async function fetchPage(kind: Kind, tab: string, filters: Filters, page: number): Promise<Paginated<MediaItem>> {
  let url: string;
  if (kind === "anime") {
    const p = new URLSearchParams({ type: "anime", tab, page: String(page) });
    url = `/api/discover?${p}`;
  } else if (tab === "discover") {
    const p = new URLSearchParams({ type: kind, page: String(page) });
    if (filters.genre) p.set("genre", filters.genre);
    if (filters.year) p.set("year", filters.year);
    if (filters.sort) p.set("sort", filters.sort);
    if (filters.rating) p.set("rating", filters.rating);
    if (filters.lang) p.set("lang", filters.lang);
    url = `/api/discover?${p}`;
  } else {
    url = `/api/${kind === "movie" ? "movies" : "tv"}/${tab}?page=${page}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as Paginated<MediaItem>;
}

export function DiscoverBrowser({
  kind,
  initialTab = "discover",
  genres,
  genreMap,
  initialData,
  lockGenre,
}: {
  kind: Kind;
  initialTab?: string;
  genres: Genre[];
  genreMap: Record<number, string>;
  initialData: Paginated<MediaItem>;
  /** When set (genre explorer), the genre filter is fixed. */
  lockGenre?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState(initialTab);
  const [filters, setFilters] = useState<Filters>({
    genre: lockGenre ?? "",
    year: "",
    sort: kind === "tv" ? "popularity.desc" : "popularity.desc",
    rating: "",
    lang: "",
  });

  const [items, setItems] = useState<MediaItem[]>(initialData.results);
  const [page, setPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [loading, setLoading] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const tabs = kind === "movie" ? MOVIE_TABS : kind === "tv" ? TV_TABS : ANIME_TABS;
  const sorts = kind === "tv" ? TV_SORTS : MOVIE_SORTS;

  // Re-run query when tab or filters change (except on first mount).
  const firstRun = useRef(true);
  const requestKey = useMemo(
    () => JSON.stringify({ tab, ...filters }),
    [tab, filters]
  );

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      setReloading(true);
      setError(null);
      try {
        const data = await fetchPage(kind, tab, filters, 1);
        if (signal?.aborted) return;
        setItems(dedupe(data.results));
        setPage(1);
        setTotalPages(data.totalPages);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        if (!signal?.aborted) setError("Could not load titles. Please try again.");
      } finally {
        if (!signal?.aborted) setReloading(false);
      }
    },
    [kind, tab, filters]
  );

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const controller = new AbortController();
    reload(controller.signal);
    // Sync shareable URL (genre explorer + filters)
    if (!lockGenre && tab === "discover") {
      const p = new URLSearchParams();
      if (filters.genre) p.set("genre", filters.genre);
      if (filters.year) p.set("year", filters.year);
      if (filters.sort) p.set("sort", filters.sort);
      if (filters.rating) p.set("rating", filters.rating);
      if (filters.lang) p.set("lang", filters.lang);
      router.replace(`?${p}`, { scroll: false });
    }
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || loading || reloading || page >= totalPages) return;
        setLoading(true);
        setError(null);
        try {
          const data = await fetchPage(kind, tab, filters, page + 1);
          setItems((prev) => dedupe([...prev, ...data.results]));
          setPage((p) => p + 1);
          setTotalPages(data.totalPages);
        } catch {
          setError("Could not load more titles.");
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: "800px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [kind, tab, filters, page, totalPages, loading, reloading]);

  const setFilter = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && k !== "sort").length;

  return (
    <div className="container-page pb-16">
      {/* Tabs */}
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all",
              tab === t.key
                ? "bg-brand text-white shadow-glow"
                : "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      {tab === "discover" && (
        <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-semibold text-white"
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-brand-peach" />
              Filters
              {activeFilterCount > 0 && (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </span>
            {showFilters ? <X className="h-4 w-4 text-neutral-400" /> : null}
          </button>

          {(showFilters || lockGenre) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 space-y-4 overflow-hidden"
            >
              {!lockGenre && (
                <FilterRow label="Genre">
                  <Chip selected={filters.genre === ""} onClick={() => setFilter({ genre: "" })}>
                    All
                  </Chip>
                  {genres.map((g) => (
                    <Chip
                      key={g.id}
                      selected={filters.genre === String(g.id)}
                      onClick={() => setFilter({ genre: String(g.id) })}
                    >
                      {g.name}
                    </Chip>
                  ))}
                </FilterRow>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Sort by
                  </span>
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilter({ sort: e.target.value })}
                    className="input-dark appearance-none"
                  >
                    {sorts.map((s) => (
                      <option key={s.key} value={s.key} className="bg-[#2b0008]">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Year
                  </span>
                  <select
                    value={filters.year}
                    onChange={(e) => setFilter({ year: e.target.value })}
                    className="input-dark appearance-none"
                  >
                    {YEARS.map((y) => (
                      <option key={y || "any"} value={y} className="bg-[#2b0008]">
                        {y || "Any year"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Minimum rating
                  </span>
                  <select
                    value={filters.rating}
                    onChange={(e) => setFilter({ rating: e.target.value })}
                    className="input-dark appearance-none"
                  >
                    {RATINGS.map((r) => (
                      <option key={r.key || "any"} value={r.key} className="bg-[#2b0008]">
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <FilterRow label="Language">
                {LANGUAGES.map((l) => (
                  <Chip key={l.key || "any"} selected={filters.lang === l.key} onClick={() => setFilter({ lang: l.key })}>
                    {l.label}
                  </Chip>
                ))}
              </FilterRow>
            </motion.div>
          )}
        </div>
      )}

      {/* Results */}
      {reloading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 tv:grid-cols-8">
          {Array.from({ length: 18 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error && items.length === 0 ? (
        <EmptyState icon={SlidersHorizontal} title="Couldn't load titles" description={error} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing matched your filters"
          description="Try widening the year range or clearing the genre filter."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 tv:grid-cols-8">
            {items.map((item, i) => (
              <MediaCard key={`${item.mediaType}-${item.id}-${i}`} item={item} genreMap={genreMap} eager={i < 12} />
            ))}
          </div>

          <div ref={sentinelRef} className="h-4" />

          <div className="mt-10 flex flex-col items-center gap-3">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                Loading more…
              </div>
            )}
            {!loading && page >= totalPages && items.length > 0 && (
              <p className="text-sm text-neutral-500">You’ve reached the end — that’s every title for this filter.</p>
            )}
            {error && items.length > 0 && (
              <button onClick={() => setLoading(false)} className="text-sm text-brand-peach underline">
                {error}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-400">
        {label}
      </span>
      <div className="no-scrollbar flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx("chip transition-all", selected && "chip-selected")}
    >
      {children}
    </button>
  );
}

function dedupe(items: MediaItem[]): MediaItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = `${i.mediaType}-${i.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
