import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getOrCreateAppUser } from "./users";
import { canManageEvent, isAdmin, isOrganizerMember } from "./helpers";

/* Port of bootstrap_my_organizer. */
export const bootstrapMyOrganizer = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const user = await getOrCreateAppUser(ctx);
    const trimmed = name.trim();
    if (trimmed.length < 2) throw new Error("ORGANIZER_NAME_REQUIRED");

    // Existing membership wins.
    const memberships = await ctx.db
      .query("organizerMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    const active = memberships
      .filter((m: any) => m.status === "ACTIVE")
      .sort((a: any, b: any) => a.createdAt - b.createdAt)[0];
    if (active) return active.organizerId;

    const now = Date.now();
    const organizerId = await ctx.db.insert("organizers", {
      name: trimmed,
      type: "EXTERNAL",
      status: "ACTIVE",
      verificationStatus: "PENDING",
      createdBy: user._id,
      email: user.email,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("organizerMembers", {
      organizerId,
      userId: user._id,
      membershipRole: "OWNER",
      status: "ACTIVE",
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const role = await ctx.db
      .query("userRoles")
      .withIndex("by_user_role", (q: any) => q.eq("userId", user._id).eq("role", "ORGANIZER"))
      .unique();
    if (!role) {
      await ctx.db.insert("userRoles", {
        userId: user._id,
        role: "ORGANIZER",
        status: "ACTIVE",
        grantedAt: now,
        createdAt: now,
      });
    } else if (role.status !== "ACTIVE") {
      await ctx.db.patch(role._id, { status: "ACTIVE", revokedAt: undefined });
    }

    return organizerId;
  },
});

/** My organizer profile(s) with membership info. */
export const listMyOrganizers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const memberships = await ctx.db
      .query("organizerMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    const out = [];
    for (const m of memberships) {
      if (m.status !== "ACTIVE") continue;
      const org = await ctx.db.get(m.organizerId);
      if (org) out.push({ organizer: org, membership: m });
    }
    return out;
  },
});

/** Staff: members of an organizer. */
export const listOrganizerMembers = query({
  args: { organizerId: v.id("organizers") },
  handler: async (ctx, { organizerId }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await isOrganizerMember(ctx, organizerId, user._id)) && !(await isAdmin(ctx, user._id))) {
      throw new Error("FORBIDDEN");
    }
    const members = await ctx.db
      .query("organizerMembers")
      .withIndex("by_organizer", (q: any) => q.eq("organizerId", organizerId))
      .collect();
    const withProfiles = [];
    for (const m of members) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q: any) => q.eq("userId", m.userId))
        .unique();
      withProfiles.push({ ...m, profile });
    }
    return withProfiles;
  },
});

/** Staff: organizer dashboard aggregates (bookings/payments for all their events). */
export const organizerDashboard = query({
  args: { organizerId: v.id("organizers") },
  handler: async (ctx, { organizerId }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await isOrganizerMember(ctx, organizerId, user._id)) && !(await isAdmin(ctx, user._id))) {
      throw new Error("FORBIDDEN");
    }
    const events = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q: any) => q.eq("organizerId", organizerId))
      .collect();

    const eventIds = events.map((e: any) => e._id);
    const allBookings = (await ctx.db.query("bookings").collect()).filter(
      (b: any) => eventIds.includes(b.eventId),
    );
    const allPayments = (await ctx.db.query("payments").collect()).filter((p: any) =>
      allBookings.some((b: any) => b._id === p.bookingId),
    );

    const now = Date.now();
    return {
      events,
      bookings: allBookings.sort((a: any, b: any) => b.createdAt - a.createdAt).slice(0, 100),
      payments: allPayments,
      totals: {
        grossMinor: allPayments
          .filter((p: any) => p.status === "CAPTURED")
          .reduce((s: number, p: any) => s + p.amountMinor, 0),
        upcomingEvents: events.filter(
          (e: any) => e.startAt > now && !["CANCELLED", "COMPLETED"].includes(e.status),
        ).length,
        ticketsSold: allBookings
          .filter((b: any) => b.status === "CONFIRMED")
          .reduce((s: number, b: any) => s + b.ticketCount, 0),
      },
    };
  },
});

/** Staff: notifications for the current user. */
export const listMyNotifications = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_time", (q: any) => q.eq("userId", user._id))
      .collect();
    rows.sort((a: any, b: any) => b.createdAt - a.createdAt);
    return rows.slice(0, 100);
  },
});

/** mark_notifications_read. */
export const markNotificationsRead = mutation({
  args: { notificationIds: v.array(v.id("notifications")) },
  handler: async (ctx, { notificationIds }) => {
    const user = await getOrCreateAppUser(ctx);
    const now = Date.now();
    for (const id of notificationIds) {
      const n = await ctx.db.get(id);
      if (n && n.userId === user._id && !n.readAt) {
        await ctx.db.patch(id, { readAt: now });
      }
    }
    return true;
  },
});

/** Volunteer management: events I'm staff on (port of accept_my_invitations result view). */
export const listMyStaffEvents = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const memberships = await ctx.db
      .query("eventMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    const out = [];
    for (const m of memberships) {
      if (m.status !== "ACTIVE") continue;
      const ev = await ctx.db.get(m.eventId);
      if (ev) out.push({ event: ev, role: m.role });
    }
    return out;
  },
});

/** Update my organizer profile (members only). */
export const updateOrganizer = mutation({
  args: {
    organizerId: v.id("organizers"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateAppUser(ctx);
    const { organizerId, ...rest } = args;
    if (!(await isOrganizerMember(ctx, organizerId, user._id)) && !(await isAdmin(ctx, user._id))) {
      throw new Error("FORBIDDEN");
    }
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, val] of Object.entries(rest)) if (val !== undefined) patch[k] = val;
    await ctx.db.patch(organizerId, patch);
    return true;
  },
});

export { canManageEvent };
