"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Search, Trash2, X } from "lucide-react";
import clsx from "clsx";
import { MediaCard, PersonCard } from "@/components/MediaCard";
import { CardSkeleton } from "@/components/MediaCard";
import { EmptyState, NoSearchResults } from "@/components/States";
import { useSearchHistory } from "@/lib/store-hooks";
import type { MediaItem, Paginated, SearchResult } from "@/lib/tmdb-types";

type SearchType = "all" | "movie" | "tv";

const TYPES: Array<{ key: SearchType; label: string }> = [
  { key: "all", label: "All" },
  { key: "movie", label: "Movies" },
  { key: "tv", label: "TV Shows" },
];

export function SearchClient({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items: history, add, clear } = useSearchHistory();

  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<SearchType>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [popular, setPopular] = useState<MediaItem[]>([]);
  const [touched, setTouched] = useState(Boolean(initialQuery));

  const inputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/movies/popular")
      .then((r) => r.json())
      .then((d: Paginated<MediaItem>) => setPopular(d.results.slice(0, 8)))
      .catch(() => {});
  }, []);

  const runSearch = useCallback(
    async (q: string, t: SearchType, page: number, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${t}&page=${page}`);
        if (!res.ok) throw new Error("failed");
        const data: Paginated<SearchResult> = await res.json();
        setResults((prev) => {
          if (append) {
            const seen = new Set(prev.map((r) => `${r.mediaType}-${r.id}`));
            return [...prev, ...data.results.filter((r) => !seen.has(`${r.mediaType}-${r.id}`))];
          }
          return data.results;
        });
        setTotalResults(data.totalResults);
        setTotalPages(data.totalPages);
        setPage(page);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const onQueryChange = (value: string) => {
    setQuery(value);
    setTouched(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      runSearch(value.trim(), type, 1);
      router.replace(`/search?q=${encodeURIComponent(value.trim())}`, { scroll: false });
    }, 350);
  };

  const onTypeChange = (t: SearchType) => {
    setType(t);
    if (query.trim().length >= 2) runSearch(query.trim(), t, 1);
  };

  const submit = () => {
    const q = query.trim();
    if (q.length < 2) return;
    add(q);
    runSearch(q, type, 1);
    router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
  };

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !query.trim() || results.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && page < totalPages) {
          runSearch(query.trim(), type, page + 1, true);
        }
      },
      { rootMargin: "600px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [query, results.length, loading, loadingMore, page, totalPages, type, runSearch]);

  const peopleResults = results.filter((r) => r.mediaType === "person");
  const mediaResults = results.filter((r) => r.mediaType !== "person");

  return (
    <div className="container-page pb-16">
      {/* Search box */}
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 transition-colors focus-within:border-brand-peach/60">
          <Search className="h-5 w-5 shrink-0 text-neutral-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Search movies, TV shows, actors…"
            autoFocus
            className="w-full bg-transparent px-4 py-4 text-base text-white placeholder:text-neutral-500 focus:outline-none"
            aria-label="Search"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setTouched(false);
                inputRef.current?.focus();
                router.replace("/search", { scroll: false });
              }}
              aria-label="Clear"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Type filter */}
        <div className="mt-4 flex justify-center gap-2">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => onTypeChange(t.key)}
              className={clsx(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                type === t.key ? "bg-brand text-white shadow-glow" : "bg-white/5 text-neutral-300 hover:bg-white/10"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent searches */}
      {!touched && history.length > 0 && (
        <div className="mx-auto mt-8 max-w-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-300">
              <Clock className="h-4 w-4" /> Recent searches
            </h2>
            <button onClick={clear} className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-brand-peach">
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h) => (
              <button
                key={h}
                onClick={() => {
                  setQuery(h);
                  setTouched(true);
                  runSearch(h, type, 1);
                }}
                className="chip hover:border-brand-peach/50"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular searches */}
      {!touched && popular.length > 0 && (
        <div className="mx-auto mt-8 max-w-2xl">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Popular right now</h2>
          <div className="flex flex-wrap gap-2">
            {popular.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setQuery(p.title);
                  setTouched(true);
                  runSearch(p.title, type, 1);
                }}
                className="chip hover:border-brand-peach/50"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mt-10">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 tv:grid-cols-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <EmptyState title="Search failed" description="TMDB search is unavailable right now. Please try again." />
        ) : query.trim().length >= 2 && results.length === 0 && !loading ? (
          <NoSearchResults query={query.trim()} />
        ) : results.length > 0 ? (
          <>
            <p className="mb-5 text-sm text-neutral-400">
              {totalResults.toLocaleString()} results for <span className="font-semibold text-white">“{query.trim()}”</span>
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 tv:grid-cols-8">
              {mediaResults.map((r) => (
                <MediaCard key={`${r.mediaType}-${r.id}`} item={r as MediaItem} showMediaType eager />
              ))}
            </div>
            {peopleResults.length > 0 && type === "all" && (
              <section className="mt-12">
                <h2 className="section-title mb-5">People</h2>
                <div className="no-scrollbar flex gap-5 overflow-x-auto pb-2">
                  {peopleResults.map((p) => (
                    <div key={p.id} className="w-24 shrink-0 sm:w-28">
                      <PersonCard
                        person={{ id: p.id, name: p.title, profilePath: p.profilePath ?? null }}
                      />
                      <p className="mt-1 line-clamp-2 text-center text-[11px] leading-tight text-neutral-500">
                        {p.overview}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <div ref={sentinelRef} className="h-4" />
            {loadingMore && (
              <div className="mt-6 flex justify-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            )}
            {!loadingMore && page >= totalPages && (
              <p className="mt-8 text-center text-sm text-neutral-500">That’s everything we found.</p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
