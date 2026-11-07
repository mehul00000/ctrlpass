import "server-only";
import { createHash } from "node:crypto";
import { promises as fsp } from "node:fs";
import path from "node:path";
import type {
  CastMember,
  CrewMember,
  Episode,
  Genre,
  MediaItem,
  MovieDetails,
  Paginated,
  RawMediaResult,
  SearchResult,
  SeasonSummary,
  TVDetails,
  Video,
} from "./tmdb-types";

// ---------------------------------------------------------------------------
// Configuration — credentials never leave the server
// ---------------------------------------------------------------------------

const API_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

const API_KEY = process.env.TMDB_API_KEY ?? "";
const ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN ?? "";

export const TMDB_CONFIGURED = Boolean(API_KEY || ACCESS_TOKEN);

/** Next.js fetch cache windows (seconds). */
const REVALIDATE = {
  trending: 900, // 15 min — keeps "new movies" fresh automatically
  lists: 1800, // 30 min
  discover: 1800,
  details: 3600, // 1 h
  genres: 604800, // 1 week
  search: 120,
} as const;

export const IMAGE_SIZES = {
  posterSmall: "w342",
  posterMedium: "w500",
  backdropSmall: "w780",
  backdropLarge: "w1280",
  profile: "w185",
  still: "w500",
  logo: "w300",
} as const;

export function imageUrl(
  path: string | null | undefined,
  size: string = IMAGE_SIZES.posterMedium
): string | null {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
}

// ---------------------------------------------------------------------------
// Core fetch with Next.js data cache
// ---------------------------------------------------------------------------

interface TmdbOptions {
  params?: Record<string, string | number | boolean | undefined>;
  revalidate?: number;
}

const MAX_ATTEMPTS = 4;
const ATTEMPT_TIMEOUT_MS = 6000; // per-attempt deadline — never hang on a dead connection
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Layered caches for resilience against flaky TMDB connectivity:
//   1. Next.js data cache (per revalidate window)
//   2. Disk cache (.next/tmdb-cache)          — survives restarts
//   3. Convex catalog cache (via the sync engine) — shared across users
// Every successful TMDB response is written through; failures fall back down
// the stack, so any title fetched once keeps working forever.
// ---------------------------------------------------------------------------

const CACHE_DIR = path.join(process.cwd(), ".next", "tmdb-cache");

function hashUrl(url: string): string {
  return createHash("sha1").update(url).digest("hex");
}

function cacheFile(url: string): string {
  return path.join(CACHE_DIR, hashUrl(url) + ".json");
}

async function writeCache(url: string, data: unknown): Promise<void> {
  try {
    await fsp.mkdir(CACHE_DIR, { recursive: true });
    await fsp.writeFile(cacheFile(url), JSON.stringify({ at: Date.now(), data }), "utf8");
  } catch {
    /* best effort */
  }
}

async function readCache(url: string): Promise<unknown | null> {
  try {
    const raw = await fsp.readFile(cacheFile(url), "utf8");
    const parsed = JSON.parse(raw) as { data?: unknown };
    return parsed.data ?? null;
  } catch {
    return null;
  }
}



// ---------------------------------------------------------------------------
// Simple concurrency limiter — bursting 15 parallel TMDB requests on a flaky
// connection triggers connection resets; capping concurrency keeps it stable.
// ---------------------------------------------------------------------------

const MAX_CONCURRENT = 4;
let activeRequests = 0;
const waiters: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return;
  }
  await new Promise<void>((resolve) => waiters.push(resolve));
  activeRequests++;
}

function releaseSlot(): void {
  activeRequests--;
  const next = waiters.shift();
  if (next) next();
}

class TmdbHttpError extends Error {}

export async function tmdb<T>(
  path: string,
  { params = {}, revalidate = REVALIDATE.lists }: TmdbOptions = {}
): Promise<T> {
  ensureWarming();
  if (!TMDB_CONFIGURED) {
    throw new Error(
      "TMDB is not configured. Set TMDB_API_KEY (or TMDB_ACCESS_TOKEN) in .env.local."
    );
  }

  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  const headers: Record<string, string> = { accept: "application/json" };
  if (ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${ACCESS_TOKEN}`;
  } else {
    url.searchParams.set("api_key", API_KEY);
  }

  // Retry transient network errors / 5xx / rate limits so prerendering and
  // runtime stay resilient against flaky connections — but fail fast so users
  // never stare at a spinner: each attempt has a hard 6s deadline.
  let lastError: unknown;
  await acquireSlot();
  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(url.toString(), {
          headers,
          next: { revalidate },
          signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
        });

        if (res.ok) {
          const json = (await res.json()) as T;
          void writeCache(url.toString(), json);
          return json;
        }

        if ((res.status >= 500 || res.status === 429) && attempt < MAX_ATTEMPTS) {
          await sleep(250 * attempt + Math.random() * 150);
          continue;
        }

        const body = await res.text().catch(() => "");
        throw new TmdbHttpError(`TMDB ${res.status} for ${path}: ${body.slice(0, 200)}`);
      } catch (err) {
        lastError = err;
        if (err instanceof TmdbHttpError) throw err;
        if (attempt === MAX_ATTEMPTS) break;
        await sleep(250 * attempt + Math.random() * 150);
      }
    }
  } finally {
    releaseSlot();
  }

  // Network exhausted — serve the last known good copy from disk.
  const cached = await readCache(url.toString());
  if (cached !== null) return cached as T;

  throw lastError instanceof Error
    ? lastError
    : new Error(`TMDB request failed for ${path}`);
}

// ---------------------------------------------------------------------------
// Opportunistic cache warming — while TMDB is reachable, quietly pre-fetch
// details for trending titles so movie/TV pages open instantly (and stay
// available during outages). Bounded; safe to run alongside traffic.
// ---------------------------------------------------------------------------

let warmingStarted = false;
const warmedRecently = new Set<string>();

/** Starts the background warmer once; called from tmdb() (Node server only). */
function ensureWarming(): void {
  if (warmingStarted || !TMDB_CONFIGURED) return;
  warmingStarted = true;

  const run = async () => {
    try {
      const [movies, shows, mixed] = await Promise.allSettled([
        getTrendingMovies("day"),
        getPopularTV(),
        getTrendingAll("day"),
      ]);
      const items = [movies, shows, mixed].flatMap((r) =>
        r.status === "fulfilled" ? r.value.results.slice(0, 14) : []
      );
      for (const item of items) {
        const key = `${item.mediaType}-${item.id}`;
        if (warmedRecently.has(key)) continue;
        warmedRecently.add(key);
        setTimeout(() => warmedRecently.delete(key), 30 * 60 * 1000);
        (item.mediaType === "movie"
          ? getMovieDetails(item.id)
          : getTVDetails(item.id)
        ).catch(() => {
          /* warming is best-effort */
        });
      }
    } catch {
      /* ignore */
    }
  };

  setTimeout(run, 5000).unref?.();
  setInterval(run, 3 * 60 * 1000).unref?.();
}

// ---------------------------------------------------------------------------
// Normalization — movie/tv shapes differ (title vs name, release_date vs ...)
// ---------------------------------------------------------------------------

export function normalizeMedia(raw: RawMediaResult, fallbackType: "movie" | "tv" = "movie"): MediaItem {
  const mediaType = raw.media_type === "tv" || raw.media_type === "movie" ? raw.media_type : fallbackType;
  return {
    id: raw.id,
    mediaType,
    title: raw.title ?? raw.name ?? "Untitled",
    originalTitle: raw.original_title ?? raw.original_name ?? raw.title ?? raw.name ?? "Untitled",
    overview: raw.overview ?? "",
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    voteAverage: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
    releaseDate: raw.release_date ?? raw.first_air_date ?? null,
    genreIds: raw.genre_ids ?? [],
    originalLanguage: raw.original_language ?? "en",
  };
}

function normalizePage(
  raw: { page: number; results: RawMediaResult[]; total_pages: number; total_results: number },
  fallbackType: "movie" | "tv"
): Paginated<MediaItem> {
  return {
    page: raw.page,
    results: (raw.results ?? []).filter((r) => r.media_type !== "person").map((r) => normalizeMedia(r, fallbackType)),
    totalPages: Math.min(raw.total_pages ?? 1, 500),
    totalResults: raw.total_results ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Catalog endpoints — the source of every automatically-populated row
// ---------------------------------------------------------------------------

export async function getTrendingMovies(window: "day" | "week" = "day", page = 1) {
  const raw = await tmdb<{ page: number; results: RawMediaResult[]; total_pages: number; total_results: number }>(
    `/trending/movie/${window}`,
    { params: { page }, revalidate: REVALIDATE.trending }
  );
  return normalizePage(raw, "movie");
}

export async function getTrendingTV(window: "day" | "week" = "day", page = 1) {
  const raw = await tmdb<{ page: number; results: RawMediaResult[]; total_pages: number; total_results: number }>(
    `/trending/tv/${window}`,
    { params: { page }, revalidate: REVALIDATE.trending }
  );
  return normalizePage(raw, "tv");
}

export async function getTrendingAll(window: "day" | "week" = "day") {
  const raw = await tmdb<{ page: number; results: RawMediaResult[]; total_pages: number; total_results: number }>(
    `/trending/all/${window}`,
    { revalidate: REVALIDATE.trending }
  );
  return normalizePage(raw, "movie");
}

export async function getPopularMovies(page = 1) {
  return normalizePage(
    await tmdb(`/movie/popular`, { params: { page }, revalidate: REVALIDATE.lists }),
    "movie"
  );
}

export async function getTopRatedMovies(page = 1) {
  return normalizePage(
    await tmdb(`/movie/top_rated`, { params: { page }, revalidate: REVALIDATE.lists }),
    "movie"
  );
}

export async function getNowPlayingMovies(page = 1) {
  return normalizePage(
    await tmdb(`/movie/now_playing`, { params: { page }, revalidate: REVALIDATE.trending }),
    "movie"
  );
}

export async function getUpcomingMovies(page = 1) {
  return normalizePage(
    await tmdb(`/movie/upcoming`, { params: { page }, revalidate: REVALIDATE.trending }),
    "movie"
  );
}

export async function getPopularTV(page = 1) {
  return normalizePage(await tmdb(`/tv/popular`, { params: { page }, revalidate: REVALIDATE.lists }), "tv");
}

export async function getTopRatedTV(page = 1) {
  return normalizePage(await tmdb(`/tv/top_rated`, { params: { page }, revalidate: REVALIDATE.lists }), "tv");
}

export async function getAiringTodayTV(page = 1) {
  return normalizePage(await tmdb(`/tv/airing_today`, { params: { page }, revalidate: REVALIDATE.trending }), "tv");
}

export async function getOnTheAirTV(page = 1) {
  return normalizePage(await tmdb(`/tv/on_the_air`, { params: { page }, revalidate: REVALIDATE.trending }), "tv");
}

export interface DiscoverFilters {
  page?: number;
  genre?: number | string;
  year?: number | string;
  sortBy?: string;
  language?: string;
  minRating?: number | string;
  minVotes?: number | string;
}

interface RawDiscover {
  page: number;
  results: RawMediaResult[];
  total_pages: number;
  total_results: number;
}

function discoverParams(f: DiscoverFilters): Record<string, string | number> {
  const p: Record<string, string | number> = {
    page: f.page ?? 1,
    sort_by: f.sortBy ?? "popularity.desc",
    include_adult: "false",
  };
  if (f.genre) p.with_genres = f.genre;
  if (f.year) p.primary_release_year = f.year;
  if (f.language) p.with_original_language = f.language;
  if (f.minRating) p["vote_average.gte"] = f.minRating;
  if (f.minVotes) p["vote_count.gte"] = f.minVotes;
  return p;
}

export async function getDiscoverMovies(f: DiscoverFilters = {}) {
  return normalizePage(
    await tmdb<RawDiscover>(`/discover/movie`, {
      params: discoverParams(f),
      revalidate: REVALIDATE.discover,
    }),
    "movie"
  );
}

export async function getDiscoverTV(f: DiscoverFilters = {}) {
  return normalizePage(
    await tmdb<RawDiscover>(`/discover/tv`, {
      params: discoverParams(f),
      revalidate: REVALIDATE.discover,
    }),
    "tv"
  );
}

/** Latest movies with meaningful traction — "Latest Releases". */
export async function getLatestReleases(page = 1) {
  return getDiscoverMovies({
    page,
    sortBy: "primary_release_date.desc",
    minVotes: 60,
    year: new Date().getFullYear(),
  });
}

// ---------------------------------------------------------------------------
// Anime — Animation genre (16) + Japanese original language
// ---------------------------------------------------------------------------

export async function getAnimeSeries(page = 1) {
  return getDiscoverTV({ page, genre: 16, language: "ja", sortBy: "popularity.desc" });
}

export async function getAnimeMovies(page = 1) {
  return getDiscoverMovies({ page, genre: 16, language: "ja", sortBy: "popularity.desc" });
}

export async function getTopRatedAnime(page = 1) {
  return getDiscoverTV({
    page,
    genre: 16,
    language: "ja",
    sortBy: "vote_average.desc",
    minRating: 7.5,
    minVotes: 120,
  });
}

// ---------------------------------------------------------------------------
// Genres
// ---------------------------------------------------------------------------

export async function getMovieGenres(): Promise<Genre[]> {
  const raw = await tmdb<{ genres: Genre[] }>(`/genre/movie/list`, { revalidate: REVALIDATE.genres });
  return raw.genres ?? [];
}

export async function getTVGenres(): Promise<Genre[]> {
  const raw = await tmdb<{ genres: Genre[] }>(`/genre/tv/list`, { revalidate: REVALIDATE.genres });
  return raw.genres ?? [];
}

// ---------------------------------------------------------------------------
// Details
// ---------------------------------------------------------------------------

interface RawDetails {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date?: string;
  first_air_date?: string;
  last_air_date?: string;
  runtime?: number | null;
  episode_run_time?: number[];
  status: string;
  tagline: string | null;
  genres: Genre[];
  original_language: string;
  budget?: number;
  revenue?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Array<{
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    poster_path: string | null;
    air_date: string | null;
    overview: string;
  }>;
  production_companies?: Array<{ id: number; name: string; logo_path: string | null }>;
  networks?: Array<{ id: number; name: string; logo_path: string | null }>;
  credits?: {
    cast: Array<{ id: number; name: string; character: string; profile_path: string | null; order: number }>;
    crew: Array<{ id: number; name: string; job: string; department: string }>;
  };
  videos?: { results: Array<{ id: string; key: string; name: string; site: string; type: string; official: boolean; published_at: string }> };
  similar?: { results: RawMediaResult[] };
  recommendations?: { results: RawMediaResult[] };
  images?: { logos: Array<{ file_path: string; iso_639_1: string | null }> };
}

function normalizeCast(raw: RawDetails["credits"]): { cast: CastMember[]; crew: CrewMember[] } {
  return {
    cast: (raw?.cast ?? []).slice(0, 18).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path,
      order: c.order,
    })),
    crew: raw?.crew ?? [],
  };
}

function pickVideo(raw: RawDetails): Video[] {
  const vids = (raw.videos?.results ?? [])
    .filter((v) => v.site === "YouTube")
    .sort((a, b) => {
      const rank = (t: string) =>
        t === "Trailer" ? 0 : t === "Teaser" ? 1 : t === "Clip" ? 2 : 3;
      return rank(a.type) - rank(b.type) || Number(b.official) - Number(a.official);
    });
  return vids.map((v) => ({
    id: v.id,
    key: v.key,
    name: v.name,
    site: v.site,
    type: v.type,
    official: v.official,
    publishedAt: v.published_at,
  }));
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  const raw = await tmdb<RawDetails>(`/movie/${id}`, {
    params: {
      append_to_response: "credits,videos,similar,recommendations,images",
      include_image_language: "en,null",
    },
    revalidate: REVALIDATE.details,
  });
  const { cast, crew } = normalizeCast(raw.credits);
  return {
    id: raw.id,
    mediaType: "movie",
    title: raw.title ?? "Untitled",
    originalTitle: raw.original_title ?? raw.title ?? "Untitled",
    overview: raw.overview ?? "",
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    logoPath: raw.images?.logos?.[0]?.file_path ?? null,
    voteAverage: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
    releaseDate: raw.release_date ?? null,
    runtime: raw.runtime ?? null,
    status: raw.status,
    tagline: raw.tagline || null,
    genres: raw.genres ?? [],
    originalLanguage: raw.original_language,
    budget: raw.budget ?? 0,
    revenue: raw.revenue ?? 0,
    productionCompanies: (raw.production_companies ?? []).slice(0, 8).map((c) => ({
      id: c.id,
      name: c.name,
      logoPath: c.logo_path,
    })),
    cast,
    crew,
    videos: pickVideo(raw),
    similar: (raw.similar?.results ?? []).map((r) => normalizeMedia(r, "movie")),
    recommendations: (raw.recommendations?.results ?? []).map((r) => normalizeMedia(r, "movie")),
  };
}

export async function getTVDetails(id: number): Promise<TVDetails> {
  const raw = await tmdb<RawDetails>(`/tv/${id}`, {
    params: {
      append_to_response: "credits,videos,similar,recommendations,images",
      include_image_language: "en,null",
    },
    revalidate: REVALIDATE.details,
  });
  const { cast, crew } = normalizeCast(raw.credits);
  return {
    id: raw.id,
    mediaType: "tv",
    title: raw.name ?? "Untitled",
    originalTitle: raw.original_name ?? raw.name ?? "Untitled",
    overview: raw.overview ?? "",
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    logoPath: raw.images?.logos?.[0]?.file_path ?? null,
    voteAverage: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
    releaseDate: raw.first_air_date ?? null,
    lastAirDate: raw.last_air_date ?? null,
    runtime: raw.episode_run_time?.[0] ?? null,
    episodeRunTime: raw.episode_run_time ?? [],
    status: raw.status,
    tagline: raw.tagline || null,
    genres: raw.genres ?? [],
    originalLanguage: raw.original_language,
    numberOfSeasons: raw.number_of_seasons ?? 0,
    numberOfEpisodes: raw.number_of_episodes ?? 0,
    seasons: (raw.seasons ?? [])
      .filter((s) => s.season_number > 0 || (raw.seasons?.length ?? 0) === 1)
      .map((s) => ({
        id: s.id,
        name: s.name,
        seasonNumber: s.season_number,
        episodeCount: s.episode_count,
        posterPath: s.poster_path,
        airDate: s.air_date,
        overview: s.overview,
      })),
    networks: (raw.networks ?? []).map((n) => ({ id: n.id, name: n.name, logoPath: n.logo_path })),
    productionCompanies: (raw.production_companies ?? []).slice(0, 8).map((c) => ({
      id: c.id,
      name: c.name,
      logoPath: c.logo_path,
    })),
    cast,
    crew,
    videos: pickVideo(raw),
    similar: (raw.similar?.results ?? []).map((r) => normalizeMedia(r, "tv")),
    recommendations: (raw.recommendations?.results ?? []).map((r) => normalizeMedia(r, "tv")),
  };
}

export async function getSeasonDetails(tvId: number, seasonNumber: number) {
  const raw = await tmdb<{
    id: number;
    name: string;
    overview: string;
    season_number: number;
    episodes: Array<{
      id: number;
      name: string;
      overview: string;
      episode_number: number;
      season_number: number;
      still_path: string | null;
      air_date: string | null;
      runtime: number | null;
      vote_average: number;
    }>;
  }>(`/tv/${tvId}/season/${seasonNumber}`, { revalidate: REVALIDATE.details });

  const episodes: Episode[] = (raw.episodes ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    overview: e.overview,
    episodeNumber: e.episode_number,
    seasonNumber: e.season_number,
    stillPath: e.still_path,
    airDate: e.air_date,
    runtime: e.runtime,
    voteAverage: e.vote_average,
  }));

  const summary: SeasonSummary = {
    id: raw.id,
    name: raw.name,
    seasonNumber: raw.season_number,
    episodeCount: episodes.length,
    posterPath: null,
    airDate: null,
    overview: raw.overview,
  };

  return { season: summary, episodes };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchMulti(query: string, page = 1): Promise<Paginated<SearchResult>> {
  const raw = await tmdb<{
    page: number;
    total_pages: number;
    total_results: number;
    results: Array<
      RawMediaResult & {
        name?: string;
        profile_path?: string | null;
        known_for?: RawMediaResult[];
        known_for_department?: string;
      }
    >;
  }>(`/search/multi`, {
    params: { query, page, include_adult: "false" },
    revalidate: REVALIDATE.search,
  });

  const results: SearchResult[] = (raw.results ?? []).map((r) => {
    if (r.media_type === "person") {
      const knownFor = (r.known_for ?? [])
        .slice(0, 3)
        .map((k) => k.title ?? k.name ?? "")
        .join(", ");
      return {
        id: r.id,
        mediaType: "person" as const,
        title: r.name ?? "Unknown",
        originalTitle: r.name ?? "",
        overview: knownFor ? `Known for ${knownFor}` : "",
        posterPath: null,
        backdropPath: null,
        profilePath: r.profile_path,
        voteAverage: 0,
        voteCount: 0,
        releaseDate: null,
        genreIds: [],
        originalLanguage: "",
      };
    }
    return normalizeMedia(r);
  });

  return {
    page: raw.page,
    results,
    totalPages: Math.min(raw.total_pages ?? 1, 500),
    totalResults: raw.total_results ?? 0,
  };
}

export async function searchMovies(query: string, page = 1) {
  return normalizePage(
    await tmdb(`/search/movie`, {
      params: { query, page, include_adult: "false" },
      revalidate: REVALIDATE.search,
    }),
    "movie"
  );
}

export async function searchTV(query: string, page = 1) {
  return normalizePage(
    await tmdb(`/search/tv`, {
      params: { query, page, include_adult: "false" },
      revalidate: REVALIDATE.search,
    }),
    "tv"
  );
}

// ---------------------------------------------------------------------------
// Small in-memory cache for rapid-fire search suggestions
// ---------------------------------------------------------------------------

const suggestionCache = new Map<string, { data: MediaItem[]; expires: number }>();
const SUGGESTION_TTL = 5 * 60 * 1000;

export async function getSearchSuggestions(query: string, limit = 8): Promise<MediaItem[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const cached = suggestionCache.get(q);
  if (cached && cached.expires > Date.now()) return cached.data;

  const data = await searchMulti(q, 1);
  const items = data.results
    .filter((r): r is MediaItem & { mediaType: "movie" | "tv" } => r.mediaType !== "person")
    .filter((r) => r.posterPath || r.backdropPath)
    .slice(0, limit);

  if (suggestionCache.size > 300) suggestionCache.clear();
  suggestionCache.set(q, { data: items, expires: Date.now() + SUGGESTION_TTL });
  return items;
}
