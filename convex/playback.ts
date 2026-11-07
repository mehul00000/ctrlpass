import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// ---------------------------------------------------------------------------
// Authorized playback resolution — internal queries over the admin-managed
// playbackSources / playbackStatus tables. Called from the Next.js server
// (which verifies the Clerk session + admin role before touching these).
// ---------------------------------------------------------------------------

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

export const isMarkedUnavailable = internalQuery({
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

export const setUnavailable = internalMutation({
  args: {
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    tmdbId: v.number(),
    unavailable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("playbackStatus")
      .withIndex("by_mediaType_tmdbId", (q: any) =>
        q.eq("mediaType", args.mediaType).eq("tmdbId", args.tmdbId)
      )
      .collect();
    const doc = all[0];
    const data = {
      tmdbId: args.tmdbId,
      mediaType: args.mediaType,
      status: args.unavailable ? ("unavailable" as const) : ("unknown" as const),
      lastCheckedAt: Date.now(),
    };
    if (doc) {
      await ctx.db.patch(doc._id, data);
      return doc._id;
    }
    return await ctx.db.insert("playbackStatus", data);
  },
});
