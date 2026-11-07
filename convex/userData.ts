import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ---------------------------------------------------------------------------
// User-owned data — watchlists, favorites, watch history, reviews, reports.
// Every function derives the user from the verified Clerk identity, so a user
// can only ever read/write their own records.
// ---------------------------------------------------------------------------

async function requireUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated: sign in to access your data.");
  return identity.subject; // Clerk userId
}

// --- users -------------------------------------------------------------------

export const syncMe = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const email = args.email.toLowerCase();
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const role: "admin" | "member" = adminEmails.includes(email) ? "admin" : "member";

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q: any) => q.eq("clerkUserId", userId))
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        username: args.username,
        email,
        imageUrl: args.imageUrl ?? undefined,
        role,
        syncedAt: now,
      });
      return { id: existing._id, role };
    }
    const id = await ctx.db.insert("users", {
      clerkUserId: userId,
      email,
      username: args.username,
      imageUrl: args.imageUrl ?? undefined,
      role,
      createdAt: now,
      syncedAt: now,
    });
    return { id, role };
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email.toLowerCase()))
      .unique();
  },
});

// --- watchlist -----------------------------------------------------------------

export const listWatchlist = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const items = await ctx.db
      .query("watchlists")
      .withIndex("by_user_added", (q: any) => q.eq("userId", userId))
      .collect();
    return items.sort((a: any, b: any) => b.addedAt - a.addedAt);
  },
});

export const toggleWatchlist = mutation({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.optional(v.union(v.string(), v.null())),
    backdropPath: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const all = await ctx.db
      .query("watchlists")
      .withIndex("by_user_added", (q: any) => q.eq("userId", userId))
      .collect();
    const existing = all.find((i: any) => i.tmdbId === args.tmdbId && i.mediaType === args.mediaType);
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("watchlists", { ...args, userId, addedAt: Date.now() });
    return true;
  },
});

// --- favorites -------------------------------------------------------------------

export const listFavorites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const items = await ctx.db
      .query("favorites")
      .withIndex("by_user_added", (q: any) => q.eq("userId", userId))
      .collect();
    return items.sort((a: any, b: any) => b.addedAt - a.addedAt);
  },
});

export const toggleFavorite = mutation({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.optional(v.union(v.string(), v.null())),
    backdropPath: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const all = await ctx.db
      .query("favorites")
      .withIndex("by_user_added", (q: any) => q.eq("userId", userId))
      .collect();
    const existing = all.find((i: any) => i.tmdbId === args.tmdbId && i.mediaType === args.mediaType);
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("favorites", { ...args, userId, addedAt: Date.now() });
    return true;
  },
});

// --- watch history -----------------------------------------------------------

export const listHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const items = await ctx.db
      .query("watchHistory")
      .withIndex("by_user_lastWatched", (q: any) => q.eq("userId", userId))
      .collect();
    return items.sort((a: any, b: any) => b.lastWatchedAt - a.lastWatchedAt).slice(0, 100);
  },
});

export const getHistoryEntry = query({
  args: {
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    tmdbId: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const all = await ctx.db
      .query("watchHistory")
      .withIndex("by_user_lastWatched", (q: any) => q.eq("userId", userId))
      .collect();
    return all.find((i: any) => i.tmdbId === args.tmdbId && i.mediaType === args.mediaType) ?? null;
  },
});

export const upsertHistory = mutation({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.optional(v.union(v.string(), v.null())),
    backdropPath: v.optional(v.union(v.string(), v.null())),
    progress: v.number(),
    duration: v.number(),
    completed: v.boolean(),
    seasonNumber: v.optional(v.number()),
    episodeNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const all = await ctx.db
      .query("watchHistory")
      .withIndex("by_user_lastWatched", (q: any) => q.eq("userId", userId))
      .collect();
    const existing = all.find((i: any) => i.tmdbId === args.tmdbId && i.mediaType === args.mediaType);
    const patch = {
      ...args,
      lastWatchedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("watchHistory", { ...patch, userId });
  },
});

export const removeHistory = mutation({
  args: {
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    tmdbId: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const all = await ctx.db
      .query("watchHistory")
      .withIndex("by_user_lastWatched", (q: any) => q.eq("userId", userId))
      .collect();
    const existing = all.find((i: any) => i.tmdbId === args.tmdbId && i.mediaType === args.mediaType);
    if (existing) await ctx.db.delete(existing._id);
    return true;
  },
});

// --- reviews -------------------------------------------------------------------

export const listReviews = query({
  args: {
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    tmdbId: v.number(),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("reviews")
      .withIndex("by_title_created", (q: any) =>
        q.eq("mediaType", args.mediaType).eq("tmdbId", args.tmdbId)
      )
      .collect();
    return items.sort((a: any, b: any) => b.createdAt - a.createdAt).slice(0, 50);
  },
});

export const createReview = mutation({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    rating: v.number(),
    reviewText: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const identity = await ctx.auth.getUserIdentity();
    if (args.rating < 1 || args.rating > 10) throw new Error("Rating must be 1-10.");
    return await ctx.db.insert("reviews", {
      tmdbId: args.tmdbId,
      mediaType: args.mediaType,
      userId,
      userName: identity?.name ?? identity?.nickname ?? "Member",
      rating: args.rating,
      reviewText: args.reviewText.slice(0, 2000),
      createdAt: Date.now(),
    });
  },
});

// --- reports -------------------------------------------------------------------

export const createReport = mutation({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    issueType: v.union(v.literal("playback"), v.literal("metadata"), v.literal("other")),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const identity = await ctx.auth.getUserIdentity();
    return await ctx.db.insert("reports", {
      userId,
      userName: identity?.name ?? identity?.nickname ?? "Member",
      tmdbId: args.tmdbId,
      mediaType: args.mediaType,
      issueType: args.issueType,
      description: args.description.slice(0, 1000),
      status: "open",
      createdAt: Date.now(),
    });
  },
});
