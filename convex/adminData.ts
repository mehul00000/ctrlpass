import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// ---------------------------------------------------------------------------
// Internal administrative functions — only callable server-side with the
// deployment's admin auth (ConvexHttpClient.setAdminAuth from the Next.js
// API routes, which first verify the Clerk session + ADMIN_EMAILS role).
// ---------------------------------------------------------------------------

export const overview = internalQuery({
  args: {},
  handler: async (ctx) => {
    const count = async (name: string) => (await ctx.db.query(name as any).collect()).length;
    const users = await count("users");
    const watchlist = await count("watchlists");
    const history = await count("watchHistory");
    const sources = await count("playbackSources");
    const reports = await count("reports");
    const activeSourcesArr = await ctx.db
      .query("playbackSources")
      .filter((q: any) => q.eq(q.field("active"), true))
      .collect();
    return {
      users,
      watchlistEntries: watchlist,
      historyRecords: history,
      sources,
      activeSources: activeSourcesArr.length,
      reports,
    };
  },
});

// --- playback sources ---------------------------------------------------------

export const listSources = internalQuery({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("playbackSources").collect();
    return items.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)).slice(0, 200);
  },
});

export const lookupSource = internalQuery({
  args: {
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    tmdbId: v.number(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("playbackSources")
      .withIndex("by_mediaType_tmdbId", (q: any) =>
        q.eq("mediaType", args.mediaType).eq("tmdbId", args.tmdbId)
      )
      .collect();
    return all.find((s: any) => s.active) ?? null;
  },
});

export const upsertSource = internalMutation({
  args: {
    key: v.string(),
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    sourceType: v.union(v.literal("hls"), v.literal("mp4")),
    videoUrl: v.string(),
    availableQualities: v.array(v.string()),
    subtitleTracks: v.array(
      v.object({ label: v.string(), srcLang: v.string(), url: v.string() })
    ),
    downloadEnabled: v.boolean(),
    downloadUrl: v.optional(v.union(v.string(), v.null())),
    rightsStatus: v.string(),
    active: v.boolean(),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("playbackSources")
      .withIndex("by_mediaType_tmdbId", (q: any) =>
        q.eq("mediaType", args.mediaType).eq("tmdbId", args.tmdbId)
      )
      .collect();
    const found = existing.find((s: any) => s.id);
    const { key, ...data } = args;
    void key;
    const full = { ...data, updatedAt: Date.now() };
    if (found) {
      await ctx.db.patch(found._id, full);
      return found._id;
    }
    return await ctx.db.insert("playbackSources", full);
  },
});

export const patchSource = internalMutation({
  args: {
    id: v.id("playbackSources"),
    patch: v.object({
      videoUrl: v.optional(v.string()),
      sourceType: v.optional(v.union(v.literal("hls"), v.literal("mp4"))),
      availableQualities: v.optional(v.array(v.string())),
      subtitleTracks: v.optional(
        v.array(v.object({ label: v.string(), srcLang: v.string(), url: v.string() }))
      ),
      downloadEnabled: v.optional(v.boolean()),
      downloadUrl: v.optional(v.union(v.string(), v.null())),
      rightsStatus: v.optional(v.string()),
      active: v.optional(v.boolean()),
      updatedAt: v.optional(v.number()),
      updatedBy: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.patch);
    return args.id;
  },
});

export const deleteSource = internalMutation({
  args: { id: v.id("playbackSources") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

// --- playback availability flag -------------------------------------------------

export const isUnavailable = internalQuery({
  args: {
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    tmdbId: v.number(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("playbackStatus")
      .withIndex("by_mediaType_tmdbId", (q: any) =>
        q.eq("mediaType", args.mediaType).eq("tmdbId", args.tmdbId)
      )
      .collect();
    const doc = all[0];
    return Boolean(doc && doc.status === "unavailable");
  },
});

export const setPlaybackStatus = internalMutation({
  args: {
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    tmdbId: v.number(),
    status: v.union(
      v.literal("unknown"),
      v.literal("available"),
      v.literal("unavailable"),
      v.literal("error")
    ),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("playbackStatus")
      .withIndex("by_mediaType_tmdbId", (q: any) =>
        q.eq("mediaType", args.mediaType).eq("tmdbId", args.tmdbId)
      )
      .collect();
    const doc = all[0];
    const data = { ...args, lastCheckedAt: Date.now() };
    if (doc) {
      await ctx.db.patch(doc._id, data);
      return doc._id;
    }
    return await ctx.db.insert("playbackStatus", data);
  },
});

// --- users ----------------------------------------------------------------------

export const listUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("users").collect();
    return items.sort((a: any, b: any) => (b.syncedAt ?? 0) - (a.syncedAt ?? 0)).slice(0, 200);
  },
});

export const patchUserRole = internalMutation({
  args: { id: v.id("users"), role: v.union(v.literal("admin"), v.literal("member")), updatedBy: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      role: args.role,
      roleUpdatedBy: args.updatedBy,
      roleUpdatedAt: Date.now(),
    });
    return args.id;
  },
});

// --- reports ----------------------------------------------------------------------

export const listReports = internalQuery({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("reports").collect();
    return items.sort((a: any, b: any) => b.createdAt - a.createdAt).slice(0, 100);
  },
});

export const setReportStatus = internalMutation({
  args: {
    id: v.id("reports"),
    status: v.union(v.literal("open"), v.literal("resolved"), v.literal("dismissed")),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      resolvedBy: args.updatedBy,
      resolvedAt: Date.now(),
    });
    return args.id;
  },
});

// --- sync logs + settings -----------------------------------------------------------

export const listSyncLogs = internalQuery({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("syncLogs").collect();
    return items.sort((a: any, b: any) => b.startedAt - a.startedAt).slice(0, 20);
  },
});

export const recordSyncLog = internalMutation({
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
    return await ctx.db.insert("syncLogs", { syncType: "scheduled", ...args });
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

export const setSyncSettings = internalMutation({
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
