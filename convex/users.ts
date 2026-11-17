import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/*
 * Identity mapping: Clerk JWT subject → CtrlPass app_users row.
 * Replaces the Supabase `handle_new_user` trigger + migration 0006 Clerk mapping.
 * On first sign-in we bootstrap app_users + profiles + ATTENDEE role.
 */

export type AppUser = {
  _id: Id<"appUsers">;
  clerkUserId: string;
  email?: string;
  status: "ACTIVE" | "PENDING" | "SUSPENDED" | "DISABLED";
};

/** Internal: resolve or create the app user for the current Clerk identity. */
export async function getOrCreateAppUser(ctx: {
  db: any;
  auth: any;
}): Promise<AppUser> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");

  const clerkUserId = identity.subject;
  const email = identity.email ?? identity.emailVerified ?? undefined;

  const existing = await ctx.db
    .query("appUsers")
    .withIndex("by_clerk_user", (q: any) => q.eq("clerkUserId", clerkUserId))
    .unique();

  const now = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, { lastLoginAt: now });
    return existing;
  }

  const userId: Id<"appUsers"> = await ctx.db.insert("appUsers", {
    clerkUserId,
    email,
    emailVerifiedAt: identity.emailVerified ? now : undefined,
    status: "ACTIVE",
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await ctx.db.insert("profiles", {
    userId,
    fullName: identity.name ?? undefined,
    profileImageUrl: identity.pictureUrl ?? undefined,
    createdAt: now,
    updatedAt: now,
  });

  await ctx.db.insert("userRoles", {
    userId,
    role: "ATTENDEE",
    status: "ACTIVE",
    grantedAt: now,
    createdAt: now,
  });

  return (await ctx.db.get(userId)) as AppUser;
}

/** Current user's identity: app_users + profile + roles. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();
    const roles = await ctx.db
      .query("userRoles")
      .withIndex("by_user_role", (q: any) => q.eq("userId", user._id))
      .collect();
    return {
      user: { ...user, _id: undefined },
      userId: user._id,
      profile,
      roles: roles
        .filter((r) => r.status === "ACTIVE")
        .map((r) => ({ role: r.role, status: r.status })),
    };
  },
});

/** Update my profile. */
export const updateProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateAppUser(ctx);
    if (user.status === "DISABLED") throw new Error("ACCOUNT_DISABLED");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();
    if (!profile) throw new Error("PROFILE_NOT_FOUND");
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const k of ["fullName", "phone", "city", "state", "profileImageUrl"] as const) {
      if (args[k] !== undefined) patch[k] = args[k];
    }
    await ctx.db.patch(profile._id, patch);
    return true;
  },
});

/** Soft-delete account (marks DISABLED). */
export const requestAccountDeactivation = internalMutation({
  args: { userId: v.id("appUsers") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { status: "DISABLED", updatedAt: Date.now() });
  },
});
