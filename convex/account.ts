import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getOrCreateAppUser } from "./users";
import { notify } from "./helpers";

/* Referrals (port of get_or_create_referral_code / apply_referral). */

export const getOrCreateReferralCode = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const existing = await ctx.db
      .query("referralCodes")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();
    if (existing) return existing.code;

    const now = Date.now();
    // 8-char A-Z0-9 code; retry on (unlikely) collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)];
      }
      const clash = await ctx.db
        .query("referralCodes")
        .withIndex("by_code", (q: any) => q.eq("code", code))
        .unique();
      if (clash) continue;
      await ctx.db.insert("referralCodes", {
        userId: user._id,
        code,
        createdAt: now,
        updatedAt: now,
      });
      return code;
    }
    throw new Error("could_not_generate_referral_code");
  },
});

export const applyReferral = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const user = await getOrCreateAppUser(ctx);
    const referrer = await ctx.db
      .query("referralCodes")
      .withIndex("by_code", (q: any) => q.eq("code", code.toUpperCase().trim()))
      .unique();
    if (!referrer) return false;
    if (referrer.userId === user._id) throw new Error("self_referral_not_allowed");

    const existing = await ctx.db
      .query("referrals")
      .withIndex("by_referred", (q: any) => q.eq("referredUserId", user._id))
      .unique();
    if (existing) return true;

    const now = Date.now();
    await ctx.db.insert("referrals", {
      referrerId: referrer.userId,
      referredUserId: user._id,
      status: "QUALIFIED",
      qualifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return true;
  },
});

export const myReferrals = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const rows = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q: any) => q.eq("referrerId", user._id))
      .collect();
    const out = [];
    for (const r of rows) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q: any) => q.eq("userId", r.referredUserId))
        .unique();
      out.push({ ...r, referredName: profile?.fullName ?? null });
    }
    return out;
  },
});

/* Consents */

export const listMyConsents = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    return ctx.db
      .query("userConsents")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
  },
});

export const setConsent = mutation({
  args: {
    consentType: v.string(),
    granted: v.boolean(),
    policyVersion: v.optional(v.string()),
  },
  handler: async (ctx, { consentType, granted, policyVersion }) => {
    const user = await getOrCreateAppUser(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("userConsents")
      .withIndex("by_user_type", (q: any) =>
        q.eq("userId", user._id).eq("consentType", consentType),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        granted,
        policyVersion,
        grantedAt: granted ? now : existing.grantedAt,
        revokedAt: granted ? undefined : now,
        updatedAt: now,
      });
      return existing._id;
    }
    return ctx.db.insert("userConsents", {
      userId: user._id,
      consentType,
      granted,
      policyVersion,
      grantedAt: now,
      revokedAt: granted ? undefined : now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/* User settings */

export const getMySettings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const row = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();
    return row?.settings ?? {};
  },
});

export const updateMySettings = mutation({
  args: { settings: v.any() },
  handler: async (ctx, { settings }) => {
    const user = await getOrCreateAppUser(ctx);
    const now = Date.now();
    const row = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();
    if (row) {
      await ctx.db.patch(row._id, { settings, updatedAt: now });
      return row._id;
    }
    return ctx.db.insert("userSettings", { userId: user._id, settings, updatedAt: now });
  },
});

/* Account deactivation (soft delete) */

export const requestAccountDeactivation = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    await ctx.db.patch(user._id, { status: "DISABLED", updatedAt: Date.now() });
    return true;
  },
});

/** Admin: grant a role to a user (never client-assignable in the old RLS either). */
export const adminGrantRole = mutation({
  args: {
    userId: v.id("appUsers"),
    role: v.union(
      v.literal("ATTENDEE"),
      v.literal("VOLUNTEER"),
      v.literal("ORGANIZER"),
      v.literal("ADMIN"),
    ),
  },
  handler: async (ctx, { userId, role }) => {
    const admin = await getOrCreateAppUser(ctx);
    const adminRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_user_role", (q: any) =>
        q.eq("userId", admin._id).eq("role", "ADMIN"),
      )
      .unique();
    if (!adminRoles || adminRoles.status !== "ACTIVE") throw new Error("FORBIDDEN");

    const now = Date.now();
    const existing = await ctx.db
      .query("userRoles")
      .withIndex("by_user_role", (q: any) => q.eq("userId", userId).eq("role", role))
      .unique();
    if (!existing) {
      await ctx.db.insert("userRoles", {
        userId,
        role,
        status: "ACTIVE",
        grantedBy: admin._id,
        grantedAt: now,
        createdAt: now,
      });
    } else {
      await ctx.db.patch(existing._id, {
        status: "ACTIVE",
        grantedBy: admin._id,
        grantedAt: now,
        revokedAt: undefined,
        revokedBy: undefined,
      });
    }
    await notify(ctx, userId, "ROLE_GRANTED", "Role granted", `You were granted the ${role} role.`, {
      role,
    });
    return true;
  },
});
