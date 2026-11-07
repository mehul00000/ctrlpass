import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// CtrlPass — Convex schema. All application data lives here; TMDB remains the
// external metadata source (cached into catalogCache by the sync engine).
// ---------------------------------------------------------------------------

export default defineSchema({
  // Clerk user mirror (identity.subject = Clerk userId)
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    username: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("member")),
    createdAt: v.number(),
    syncedAt: v.number(),
    roleUpdatedBy: v.optional(v.string()),
    roleUpdatedAt: v.optional(v.number()),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_email", ["email"]),

  watchlists: defineTable({
    userId: v.string(),
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.optional(v.union(v.string(), v.null())),
    backdropPath: v.optional(v.union(v.string(), v.null())),
    addedAt: v.number(),
  }).index("by_user_added", ["userId", "addedAt"]),

  favorites: defineTable({
    userId: v.string(),
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.optional(v.union(v.string(), v.null())),
    backdropPath: v.optional(v.union(v.string(), v.null())),
    addedAt: v.number(),
  }).index("by_user_added", ["userId", "addedAt"]),

  watchHistory: defineTable({
    userId: v.string(),
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.optional(v.union(v.string(), v.null())),
    backdropPath: v.optional(v.union(v.string(), v.null())),
    progress: v.number(), // seconds watched
    duration: v.number(), // seconds total
    completed: v.boolean(),
    seasonNumber: v.optional(v.number()),
    episodeNumber: v.optional(v.number()),
    lastWatchedAt: v.number(),
  }).index("by_user_lastWatched", ["userId", "lastWatchedAt"]),

  reviews: defineTable({
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    userId: v.string(),
    userName: v.string(),
    rating: v.number(),
    reviewText: v.string(),
    createdAt: v.number(),
  }).index("by_title_created", ["mediaType", "tmdbId", "createdAt"]),

  // Automated TMDB discovery cache (written by the sync engine)
  catalogCache: defineTable({
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    originalTitle: v.string(),
    overview: v.string(),
    posterPath: v.optional(v.union(v.string(), v.null())),
    backdropPath: v.optional(v.union(v.string(), v.null())),
    releaseDate: v.optional(v.union(v.string(), v.null())),
    genreIds: v.array(v.number()),
    popularity: v.optional(v.number()),
    voteAverage: v.number(),
    originalLanguage: v.string(),
    categories: v.array(v.string()),
    isAnime: v.boolean(),
    lastSyncedAt: v.number(),
  })
    .index("by_mediaType", ["mediaType"])
    .index("by_isAnime", ["isAnime"]),

  // Admin-configured authorized playback sources (HLS / MP4)
  playbackSources: defineTable({
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
    updatedAt: v.number(),
    updatedBy: v.string(),
  }).index("by_mediaType_tmdbId", ["mediaType", "tmdbId"]),

  // Admin-controlled availability flag (short-circuits the playback chain)
  playbackStatus: defineTable({
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    status: v.union(
      v.literal("unknown"),
      v.literal("available"),
      v.literal("unavailable"),
      v.literal("error")
    ),
    lastCheckedAt: v.number(),
  }).index("by_mediaType_tmdbId", ["mediaType", "tmdbId"]),

  syncLogs: defineTable({
    syncType: v.string(),
    startedAt: v.number(),
    completedAt: v.number(),
    status: v.union(v.literal("success"), v.literal("partial"), v.literal("skipped")),
    itemsDiscovered: v.number(),
    itemsInserted: v.number(),
    itemsUpdated: v.number(),
    errors: v.number(),
    lists: v.optional(v.array(v.string())),
  }).index("by_startedAt", ["startedAt"]),

  platformSettings: defineTable({
    key: v.string(),
    automaticSyncEnabled: v.optional(v.boolean()),
    syncFrequencyHours: v.optional(v.number()),
    lastSuccessfulSync: v.optional(v.number()),
    lastRunAt: v.optional(v.number()),
  }).index("by_key", ["key"]),

  reports: defineTable({
    userId: v.string(),
    userName: v.string(),
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    issueType: v.union(v.literal("playback"), v.literal("metadata"), v.literal("other")),
    description: v.string(),
    status: v.union(v.literal("open"), v.literal("resolved"), v.literal("dismissed")),
    createdAt: v.number(),
    resolvedBy: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
  }).index("by_status_created", ["status", "createdAt"]),
});
