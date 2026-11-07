import { v } from "convex/values";
import { action, mutation, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";

// ---------------------------------------------------------------------------
// Automated TMDB catalog discovery + synchronization.
// The sync action fetches bounded pages from TMDB (using TMDB_API_KEY set on
// the deployment) and upserts into catalogCache — keyed `${mediaType}_${id}`,
// so repeated runs never create duplicates. Runs are recorded in syncLogs and
// the schedule state in platformSettings. Convex cron triggers it every 6h
// (convex/crons.ts); admins can also trigger it manually.
// ---------------------------------------------------------------------------

const GENRE_NAMES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
  53: "Thriller", 10752: "War", 37: "Western", 10759: "Action & Adventure",
  10765: "Sci-Fi & Fantasy", 10768: "War & Politics",
};

const MAX_ITEMS_PER_LIST = 40;

const LISTS: Array<{ key: string; label: string; path: string; pages: number; anime: boolean; type: "movie" | "tv" }> = [
  { key: "trending-movies", label: "Trending Movies", path: "/trending/movie/day", pages: 2, anime: false, type: "movie" },
  { key: "popular-movies", label: "Popular Movies", path: "/movie/popular", pages: 2, anime: false, type: "movie" },
  { key: "top-rated-movies", label: "Top Rated Movies", path: "/movie/top_rated", pages: 1, anime: false, type: "movie" },
  { key: "now-playing", label: "Now Playing", path: "/movie/now_playing", pages: 1, anime: false, type: "movie" },
  { key: "upcoming", label: "Upcoming Movies", path: "/movie/upcoming", pages: 1, anime: false, type: "movie" },
  { key: "trending-tv", label: "Trending TV Shows", path: "/trending/tv/day", pages: 2, anime: false, type: "tv" },
  { key: "popular-tv", label: "Popular TV Shows", path: "/tv/popular", pages: 2, anime: false, type: "tv" },
  { key: "on-the-air", label: "On The Air", path: "/tv/on_the_air", pages: 1, anime: false, type: "tv" },
  { key: "top-rated-tv", label: "Top Rated TV", path: "/tv/top_rated", pages: 1, anime: false, type: "tv" },
  { key: "anime-series", label: "Anime Series", path: "/discover/tv?with_genres=16&with_original_language=ja", pages: 1, anime: true, type: "tv" },
  { key: "anime-movies", label: "Anime Movies", path: "/discover/movie?with_genres=16&with_original_language=ja", pages: 1, anime: true, type: "movie" },
];

export const catalogCounts = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("catalogCache").collect();
    const movies = all.filter((i: any) => i.mediaType === "movie" && !i.isAnime).length;
    const tv = all.filter((i: any) => i.mediaType === "tv" && !i.isAnime).length;
    const anime = all.filter((i: any) => i.isAnime).length;
    return { movies, tv, anime, total: all.length };
  },
});

export const getSyncSettings = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q: any) => q.eq("key", "sync"))
      .collect();
    return all[0] ?? null;
  },
});

export const patchSyncSettings = internalMutation({
  args: {
    automaticSyncEnabled: v.optional(v.boolean()),
    syncFrequencyHours: v.optional(v.number()),
    lastSuccessfulSync: v.optional(v.number()),
    lastRunAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q: any) => q.eq("key", "sync"))
      .collect();
    const doc = all[0];
    if (doc) {
      await ctx.db.patch(doc._id, args);
      return doc._id;
    }
    return await ctx.db.insert("platformSettings", { key: "sync", ...args });
  },
});

export const upsertCatalogBatch = internalMutation({
  args: {
    items: v.array(
      v.object({
        tmdbId: v.number(),
        mediaType: v.union(v.literal("movie"), v.literal("tv")),
        title: v.string(),
        originalTitle: v.string(),
        overview: v.string(),
        posterPath: v.optional(v.union(v.string(), v.null())),
        backdropPath: v.optional(v.union(v.string(), v.null())),
        releaseDate: v.optional(v.union(v.string(), v.null())),
        genreIds: v.array(v.number()),
        voteAverage: v.number(),
        originalLanguage: v.string(),
        categories: v.array(v.string()),
        isAnime: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("catalogCache").collect();
    const byKey = new Map<string, any>();
    existing.forEach((i: any) => byKey.set(`${i.mediaType}_${i.tmdbId}`, i));

    let inserted = 0;
    let updated = 0;
    const now = Date.now();
    for (const item of args.items) {
      const key = `${item.mediaType}_${item.tmdbId}`;
      const found = byKey.get(key);
      if (found) {
        await ctx.db.patch(found._id, { ...item, lastSyncedAt: now });
        updated++;
      } else {
        await ctx.db.insert("catalogCache", { ...item, lastSyncedAt: now });
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

export const insertSyncLog = internalMutation({
  args: {
    startedAt: v.number(),
    completedAt: v.number(),
    status: v.union(v.literal("success"), v.literal("partial"), v.literal("skipped")),
    itemsDiscovered: v.number(),
    itemsInserted: v.number(),
    itemsUpdated: v.number(),
    errors: v.number(),
    lists: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("syncLogs", { syncType: "scheduled", ...args });
    await patchSyncSettingsHandler(ctx, { lastRunAt: args.completedAt, lastSuccessfulSync: args.status === "success" ? args.completedAt : undefined });
    return true;
  },
});

async function patchSyncSettingsHandler(ctx: any, patch: Record<string, unknown>) {
  const all = await ctx.db
    .query("platformSettings")
    .withIndex("by_key", (q: any) => q.eq("key", "sync"))
    .collect();
  const doc = all[0];
  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
  if (doc) await ctx.db.patch(doc._id, clean);
  else await ctx.db.insert("platformSettings", { key: "sync", ...clean });
}

export const syncAll = action({
  args: { types: v.optional(v.array(v.string())) },
  returns: v.object({
    startedAt: v.number(),
    completedAt: v.number(),
    totalDiscovered: v.number(),
    totalInserted: v.number(),
    totalUpdated: v.number(),
    totalErrors: v.number(),
    skipped: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<any> => {
    const startedAt = Date.now();
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return {
        startedAt,
        completedAt: Date.now(),
        totalDiscovered: 0,
        totalInserted: 0,
        totalUpdated: 0,
        totalErrors: 0,
        skipped: "TMDB_API_KEY is not set on the Convex deployment (`npx convex env set TMDB_API_KEY ...`).",
      };
    }

    const selected = args.types?.length
      ? LISTS.filter((l) => args.types!.includes(l.key))
      : LISTS;

    let totalDiscovered = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    const listKeys: string[] = [];
    let status: "success" | "partial" = "success";

    for (const list of selected) {
      let items: any[] = [];
      try {
        for (let page = 1; page <= list.pages; page++) {
          const sep = list.path.includes("?") ? "&" : "?";
          const res: any = await fetch(
            `https://api.themoviedb.org/3${list.path}${sep}api_key=${apiKey}&page=${page}`,
            { headers: { accept: "application/json" } }
          );
          if (!res.ok) throw new Error(`TMDB ${res.status}`);
          const data = await res.json();
          items = items.concat((data.results ?? []).slice(0, MAX_ITEMS_PER_LIST / list.pages));
        }
      } catch {
        status = "partial";
        continue;
      }

      const cleaned = items
        .filter((i: any) => !i.adult)
        .slice(0, MAX_ITEMS_PER_LIST)
        .map((i: any) => ({
          tmdbId: i.id,
          mediaType: list.type,
          title: i.title ?? i.name ?? "Untitled",
          originalTitle: i.original_title ?? i.original_name ?? i.title ?? i.name ?? "Untitled",
          overview: (i.overview ?? "").slice(0, 600),
          posterPath: i.poster_path ?? null,
          backdropPath: i.backdrop_path ?? null,
          releaseDate: i.release_date ?? i.first_air_date ?? null,
          genreIds: i.genre_ids ?? [],
          voteAverage: i.vote_average ?? 0,
          originalLanguage: i.original_language ?? "en",
          categories: Array.from(
            new Set([
              ...(list.anime ? ["Anime"] : []),
              ...(i.genre_ids ?? []).map((g: number) => GENRE_NAMES[g]).filter(Boolean),
            ])
          ),
          isAnime: list.anime,
        }));

      const result: any = await ctx.runMutation(internal.catalog.upsertCatalogBatch, { items: cleaned });
      totalDiscovered += cleaned.length;
      totalInserted += result.inserted;
      totalUpdated += result.updated;
      listKeys.push(list.key);
    }

    const completedAt = Date.now();
    await ctx.runMutation(internal.catalog.insertSyncLog, {
      startedAt,
      completedAt,
      status,
      itemsDiscovered: totalDiscovered,
      itemsInserted: totalInserted,
      itemsUpdated: totalUpdated,
      errors: 0,
      lists: listKeys,
    });

    return {
      startedAt,
      completedAt,
      totalDiscovered,
      totalInserted,
      totalUpdated,
      totalErrors: status === "partial" ? 1 : 0,
    };
  },
});

export const syncLogs = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("syncLogs").collect();
    return items.sort((a: any, b: any) => b.startedAt - a.startedAt).slice(0, 20);
  },
});

export const syncSettings = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q: any) => q.eq("key", "sync"))
      .collect();
    return all[0] ?? null;
  },
});

export const setAutomaticSyncEnabled = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q: any) => q.eq("key", "sync"))
      .collect();
    const doc = all[0];
    if (doc) await ctx.db.patch(doc._id, { automaticSyncEnabled: args.enabled, syncFrequencyHours: 6 });
    else await ctx.db.insert("platformSettings", { key: "sync", automaticSyncEnabled: args.enabled, syncFrequencyHours: 6 });
    return true;
  },
});

export const counts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("catalogCache").collect();
    return { catalog: all.length };
  },
});
