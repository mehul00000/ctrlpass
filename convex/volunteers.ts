import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getOrCreateAppUser } from "./users";
import { canManageEvent, isAdmin } from "./helpers";

/* Volunteer invitations — port of migration 0005 functions. */

const INVITE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const inviteVolunteer = mutation({
  args: {
    eventId: v.id("events"),
    email: v.string(),
    role: v.optional(
      v.union(v.literal("VOLUNTEER"), v.literal("SCANNER"), v.literal("EVENT_MANAGER")),
    ),
  },
  handler: async (ctx, { eventId, email, role }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, eventId, user._id)) && !(await isAdmin(ctx, user._id))) {
      throw new Error("not_authorized");
    }
    const trimmed = email.trim();
    if (!trimmed || !EMAIL_RE.test(trimmed)) throw new Error("invalid_email");
    const normalized = trimmed.toLowerCase();
    const inviteRole = role ?? "VOLUNTEER";
    const now = Date.now();

    const existing = await ctx.db
      .query("volunteerInvitations")
      .withIndex("by_event_email", (q: any) =>
        q.eq("eventId", eventId).eq("email", normalized),
      )
      .unique();

    if (!existing) {
      return ctx.db.insert("volunteerInvitations", {
        eventId,
        email: normalized,
        role: inviteRole,
        status: "PENDING",
        token: Math.random().toString(36).slice(2) + now.toString(36),
        invitedBy: user._id,
        expiresAt: now + INVITE_WINDOW_MS,
        createdAt: now,
        updatedAt: now,
      });
    }
    if (existing.status === "ACCEPTED") throw new Error("invitation_already_accepted");
    await ctx.db.patch(existing._id, {
      status: "PENDING",
      role: inviteRole,
      token: Math.random().toString(36).slice(2) + now.toString(36),
      expiresAt: now + INVITE_WINDOW_MS,
      invitedBy: user._id,
      updatedAt: now,
    });
    return existing._id;
  },
});

export const resendVolunteerInvitation = mutation({
  args: { invitationId: v.id("volunteerInvitations") },
  handler: async (ctx, { invitationId }) => {
    const user = await getOrCreateAppUser(ctx);
    const inv = await ctx.db.get(invitationId);
    if (!inv) throw new Error("not_found");
    if (!(await canManageEvent(ctx, inv.eventId, user._id)) && !(await isAdmin(ctx, user._id))) {
      throw new Error("not_authorized");
    }
    if (["PENDING", "SENT", "EXPIRED"].includes(inv.status)) {
      await ctx.db.patch(invitationId, {
        status: "PENDING",
        expiresAt: Date.now() + INVITE_WINDOW_MS,
        updatedAt: Date.now(),
      });
    }
    return true;
  },
});

export const revokeVolunteerInvitation = mutation({
  args: { invitationId: v.id("volunteerInvitations") },
  handler: async (ctx, { invitationId }) => {
    const user = await getOrCreateAppUser(ctx);
    const inv = await ctx.db.get(invitationId);
    if (!inv) throw new Error("not_found");
    if (!(await canManageEvent(ctx, inv.eventId, user._id)) && !(await isAdmin(ctx, user._id))) {
      throw new Error("not_authorized");
    }
    if (["PENDING", "SENT"].includes(inv.status)) {
      await ctx.db.patch(invitationId, { status: "REVOKED", updatedAt: Date.now() });
    }
    return true;
  },
});

/** Called by a volunteer after sign-in: activates matching invitations. */
export const acceptMyInvitations = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const email = (user.email ?? "").toLowerCase();
    if (!email) return 0;

    const now = Date.now();
    const invites = await ctx.db
      .query("volunteerInvitations")
      .withIndex("by_email_status", (q: any) => q.eq("email", email))
      .collect();
    let count = 0;
    for (const inv of invites) {
      if (!["PENDING", "SENT"].includes(inv.status) || inv.expiresAt <= now) continue;
      await ctx.db.patch(inv._id, { status: "ACCEPTED", acceptedAt: now, updatedAt: now });

      const member = await ctx.db
        .query("eventMembers")
        .withIndex("by_event_user_role", (q: any) =>
          q.eq("eventId", inv.eventId).eq("userId", user._id).eq("role", inv.role),
        )
        .unique();
      if (member) {
        await ctx.db.patch(member._id, { status: "ACTIVE", updatedAt: now });
      } else {
        await ctx.db.insert("eventMembers", {
          eventId: inv.eventId,
          userId: user._id,
          role: inv.role,
          status: "ACTIVE",
          joinedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }

      const role = await ctx.db
        .query("userRoles")
        .withIndex("by_user_role", (q: any) =>
          q.eq("userId", user._id).eq("role", "VOLUNTEER"),
        )
        .unique();
      if (!role) {
        await ctx.db.insert("userRoles", {
          userId: user._id,
          role: "VOLUNTEER",
          status: "ACTIVE",
          grantedAt: now,
          createdAt: now,
        });
      } else if (role.status !== "ACTIVE") {
        await ctx.db.patch(role._id, { status: "ACTIVE" });
      }
      count++;
    }
    return count;
  },
});

/** Staff: invitations for an event. */
export const listEventInvitations = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, eventId, user._id)) && !(await isAdmin(ctx, user._id))) {
      throw new Error("FORBIDDEN");
    }
    const rows = await ctx.db
      .query("volunteerInvitations")
      .withIndex("by_event_email", (q: any) => q.eq("eventId", eventId))
      .collect();
    rows.sort((a: any, b: any) => b.createdAt - a.createdAt);
    return rows;
  },
});

/** Event members for an event (staff). */
export const listEventMembers = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, eventId, user._id)) && !(await isAdmin(ctx, user._id))) {
      throw new Error("FORBIDDEN");
    }
    const rows = await ctx.db
      .query("eventMembers")
      .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
      .collect();
    const out = [];
    for (const m of rows) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q: any) => q.eq("userId", m.userId))
        .unique();
      out.push({ ...m, profile });
    }
    return out;
  },
});
