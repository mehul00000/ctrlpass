import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getOrCreateAppUser } from "./users";
import {
  canManageEvent,
  canScanEvent,
  eventIsPubliclyListed,
  hasActiveRole,
  isAdmin,
  isOrganizerMember,
} from "./helpers";

/* ─────────────────────────── queries ─────────────────────────── */

/** Public discovery: all publicly listed events, soonest first. */
export const listPublicEvents = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, { category }) => {
    let events = await ctx.db
      .query("events")
      .withIndex("by_status_visibility", (q: any) => q.eq("visibility", "PUBLIC"))
      .collect();
    events = events.filter(
      (e: any) =>
        ["PUBLISHED", "SALES_OPEN", "SALES_CLOSED", "ONGOING", "COMPLETED"].includes(e.status) &&
        (!category || e.category === category),
    );
    events.sort((a: any, b: any) => a.startAt - b.startAt);
    return events;
  },
});

/** Event detail for public view (includes ticket types when sales are open). */
export const getPublicEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const ev = await ctx.db.get(eventId);
    if (!ev || !eventIsPubliclyListed(ev.status, ev.visibility)) return null;
    const organizer = await ctx.db.get(ev.organizerId);
    const venue = ev.venueId ? await ctx.db.get(ev.venueId) : null;
    const ticketTypes = (
      await ctx.db
        .query("ticketTypes")
        .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
        .collect()
    ).filter((t: any) => t.status === "ACTIVE" && t.visibility === "VISIBLE");
    const online = await ctx.db
      .query("eventOnlineDetails")
      .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
      .unique();
    return {
      event: ev,
      organizer: organizer ? { name: organizer.name, city: organizer.city } : null,
      venue,
      ticketTypes,
      hasOnlineDetails: !!online,
    };
  },
});

/** Organizer portal: events my organizer can manage. */
export const listMyOrganizerEvents = query({
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
    events.sort((a: any, b: any) => b.createdAt - a.createdAt);
    return events;
  },
});

/** Events the current user manages (owner member or event manager). */
export const listManagedEvents = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const memberships = await ctx.db
      .query("organizerMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    const activeOrgIds = memberships
      .filter((m: any) => m.status === "ACTIVE")
      .map((m: any) => m.organizerId);

    const results: any[] = [];
    for (const organizerId of activeOrgIds) {
      const events = await ctx.db
        .query("events")
        .withIndex("by_organizer", (q: any) => q.eq("organizerId", organizerId))
        .collect();
      results.push(...events);
    }

    // Events where the user is an event manager.
    const eventMembers = await ctx.db
      .query("eventMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    for (const m of eventMembers) {
      if (m.status !== "ACTIVE" || m.role !== "EVENT_MANAGER") continue;
      const ev = await ctx.db.get(m.eventId);
      if (ev && !results.some((e) => e._id === ev._id)) results.push(ev);
    }
    if (await isAdmin(ctx, user._id)) {
      const all = await ctx.db.query("events").collect();
      for (const ev of all) if (!results.some((e) => e._id === ev._id)) results.push(ev);
    }
    results.sort((a, b) => b.createdAt - a.createdAt);
    return results;
  },
});

/** Events I can scan (volunteer/scanner). */
export const listScannableEvents = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const memberships = await ctx.db
      .query("eventMembers")
      .withIndex("by_user_status", (q: any) => q.eq("userId", user._id).eq("status", "ACTIVE"))
      .collect();
    const out: any[] = [];
    for (const m of memberships) {
      if (m.role === "VOLUNTEER" || m.role === "SCANNER" || m.role === "EVENT_MANAGER") {
        const ev = await ctx.db.get(m.eventId);
        if (ev) out.push(ev);
      }
    }
    return out;
  },
});

/** Event detail for an authorized staff member (includes online details). */
export const getStaffEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    const manage = await canManageEvent(ctx, eventId, user._id);
    const scan = await canScanEvent(ctx, eventId, user._id);
    if (!manage && !scan) throw new Error("FORBIDDEN");
    const ev = await ctx.db.get(eventId);
    if (!ev) return null;
    const venue = ev.venueId ? await ctx.db.get(ev.venueId) : null;
    const online = await ctx.db
      .query("eventOnlineDetails")
      .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
      .unique();
    const ticketTypes = await ctx.db
      .query("ticketTypes")
      .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
      .collect();
    return { event: ev, venue, onlineDetails: online, ticketTypes, canManage: manage };
  },
});

/** Registration fields for an event (public when listed, staff always). */
export const listRegistrationFields = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const fields = await ctx.db
      .query("registrationFields")
      .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
      .collect();
    fields.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
    return fields.filter((f: any) => f.status === "ACTIVE");
  },
});

/* ─────────────────────────── mutations ─────────────────────────── */

function slugRef(prefix: string, n: number) {
  return `${prefix}-${n.toString(36).toUpperCase().padStart(8, "0")}`;
}

/** Create an event (organizer member required). */
export const createEvent = mutation({
  args: {
    organizerId: v.id("organizers"),
    name: v.string(),
    shortDescription: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    format: v.union(v.literal("PHYSICAL"), v.literal("ONLINE"), v.literal("HYBRID")),
    visibility: v.optional(v.union(v.literal("PUBLIC"), v.literal("PRIVATE"), v.literal("UNLISTED"))),
    venueId: v.optional(v.id("venues")),
    startAt: v.number(),
    endAt: v.number(),
    timezone: v.optional(v.string()),
    doorsOpenAt: v.optional(v.number()),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await isOrganizerMember(ctx, args.organizerId, user._id)) && !(await isAdmin(ctx, user._id))) {
      throw new Error("FORBIDDEN");
    }
    if (args.endAt <= args.startAt) throw new Error("INVALID_TIME_RANGE");
    const now = Date.now();
    const eventId = await ctx.db.insert("events", {
      organizerId: args.organizerId,
      name: args.name,
      shortDescription: args.shortDescription ?? "",
      description: args.description ?? "",
      category: args.category ?? "OTHER",
      coverImageUrl: args.coverImageUrl,
      format: args.format,
      status: "DRAFT",
      visibility: args.visibility ?? "PUBLIC",
      venueId: args.venueId,
      startAt: args.startAt,
      endAt: args.endAt,
      timezone: args.timezone ?? "Asia/Kolkata",
      doorsOpenAt: args.doorsOpenAt,
      capacity: args.capacity,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("auditLogs", {
      actorUserId: user._id,
      action: "EVENT_CREATED",
      resourceType: "event",
      resourceId: eventId,
      eventId,
      organizerId: args.organizerId,
      createdAt: now,
    });
    return eventId;
  },
});

/** Update editable event fields. */
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    name: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    format: v.optional(v.union(v.literal("PHYSICAL"), v.literal("ONLINE"), v.literal("HYBRID"))),
    visibility: v.optional(v.union(v.literal("PUBLIC"), v.literal("PRIVATE"), v.literal("UNLISTED"))),
    venueId: v.optional(v.id("venues")),
    startAt: v.optional(v.number()),
    endAt: v.optional(v.number()),
    doorsOpenAt: v.optional(v.number()),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, args.eventId, user._id))) throw new Error("FORBIDDEN");
    const ev = await ctx.db.get(args.eventId);
    if (!ev) throw new Error("EVENT_NOT_FOUND");
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, val] of Object.entries(args)) {
      if (k !== "eventId" && val !== undefined) patch[k] = val;
    }
    if (patch.startAt !== undefined && patch.endAt === undefined && (patch.startAt as number) >= ev.endAt) {
      throw new Error("INVALID_TIME_RANGE");
    }
    if (patch.endAt !== undefined && patch.startAt === undefined && (patch.endAt as number) <= ev.startAt) {
      throw new Error("INVALID_TIME_RANGE");
    }
    await ctx.db.patch(ev._id, patch);
    return true;
  },
});

/** Set or replace the event's online details. */
export const upsertOnlineDetails = mutation({
  args: {
    eventId: v.id("events"),
    platform: v.optional(v.string()),
    accessUrl: v.optional(v.string()),
    accessInstructions: v.optional(v.string()),
    passwordReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, args.eventId, user._id))) throw new Error("FORBIDDEN");
    const now = Date.now();
    const existing = await ctx.db
      .query("eventOnlineDetails")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .unique();
    const { eventId, ...rest } = args;
    if (existing) {
      await ctx.db.patch(existing._id, { ...rest, updatedAt: now });
      return existing._id;
    }
    return ctx.db.insert("eventOnlineDetails", { eventId, ...rest, createdAt: now, updatedAt: now });
  },
});

/** Create a venue (organizer role required). */
export const createVenue = mutation({
  args: {
    name: v.string(),
    addressLine: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    pincode: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    mapsReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateAppUser(ctx);
    if (
      !(await hasActiveRole(ctx, user._id, "ORGANIZER")) &&
      !(await isAdmin(ctx, user._id))
    ) {
      throw new Error("FORBIDDEN");
    }
    const now = Date.now();
    return ctx.db.insert("venues", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Lifecycle: submit_event. */
export const submitEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, eventId, user._id))) throw new Error("FORBIDDEN");
    const ev = await ctx.db.get(eventId);
    if (!ev) throw new Error("EVENT_NOT_FOUND");
    if (ev.status !== "DRAFT") throw new Error("INVALID_TRANSITION");
    const now = Date.now();
    await ctx.db.patch(eventId, { status: "SUBMITTED_FOR_REVIEW", submittedAt: now, updatedAt: now });
    await ctx.db.insert("auditLogs", {
      actorUserId: user._id,
      action: "EVENT_SUBMITTED",
      resourceType: "event",
      resourceId: eventId,
      eventId,
      organizerId: ev.organizerId,
      createdAt: now,
    });
    return { status: "SUBMITTED_FOR_REVIEW" };
  },
});

/** Lifecycle: admin_review_event. */
export const adminReviewEvent = mutation({
  args: {
    eventId: v.id("events"),
    approve: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, approve, reason }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await isAdmin(ctx, user._id))) throw new Error("FORBIDDEN");
    const ev = await ctx.db.get(eventId);
    if (!ev) throw new Error("EVENT_NOT_FOUND");
    if (ev.status !== "SUBMITTED_FOR_REVIEW") throw new Error("INVALID_TRANSITION");
    const now = Date.now();
    if (approve) {
      await ctx.db.patch(eventId, { status: "APPROVED", approvedAt: now, updatedAt: now });
    } else {
      await ctx.db.patch(eventId, { status: "DRAFT", updatedAt: now });
    }
    await ctx.db.insert("auditLogs", {
      actorUserId: user._id,
      actorRole: "ADMIN",
      action: approve ? "EVENT_APPROVED" : "EVENT_REJECTED",
      resourceType: "event",
      resourceId: eventId,
      eventId,
      metadata: { reason: reason ?? null },
      createdAt: now,
    });
    return { status: approve ? "APPROVED" : "DRAFT" };
  },
});

/** Lifecycle: publish_event. */
export const publishEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, eventId, user._id))) throw new Error("FORBIDDEN");
    const ev = await ctx.db.get(eventId);
    if (!ev || ev.status !== "APPROVED") throw new Error("INVALID_TRANSITION");
    const now = Date.now();
    await ctx.db.patch(eventId, { status: "PUBLISHED", publishedAt: now, updatedAt: now });
    return { status: "PUBLISHED" };
  },
});

/** Lifecycle: open_sales. */
export const openSales = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, eventId, user._id))) throw new Error("FORBIDDEN");
    const ev = await ctx.db.get(eventId);
    if (!ev || !["PUBLISHED", "SALES_CLOSED"].includes(ev.status)) {
      throw new Error("INVALID_TRANSITION");
    }
    await ctx.db.patch(eventId, { status: "SALES_OPEN", updatedAt: Date.now() });
    return { status: "SALES_OPEN" };
  },
});

/** Lifecycle: close_sales. */
export const closeSales = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, eventId, user._id))) throw new Error("FORBIDDEN");
    const ev = await ctx.db.get(eventId);
    if (!ev || ev.status !== "SALES_OPEN") throw new Error("INVALID_TRANSITION");
    await ctx.db.patch(eventId, { status: "SALES_CLOSED", updatedAt: Date.now() });
    return { status: "SALES_CLOSED" };
  },
});

/** Upsert the refund policy for an event. */
export const upsertRefundPolicy = mutation({
  args: {
    eventId: v.id("events"),
    refundDeadline: v.optional(v.number()),
    organizerCancelRefund: v.optional(v.boolean()),
    attendeeCancelAllowed: v.optional(v.boolean()),
    bookingFeeRefundable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, args.eventId, user._id))) throw new Error("FORBIDDEN");
    const now = Date.now();
    const existing = await ctx.db
      .query("refundPolicies")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        refundDeadline: args.refundDeadline,
        organizerCancelRefund: args.organizerCancelRefund ?? existing.organizerCancelRefund,
        attendeeCancelAllowed: args.attendeeCancelAllowed ?? existing.attendeeCancelAllowed,
        bookingFeeRefundable: args.bookingFeeRefundable ?? existing.bookingFeeRefundable,
        updatedAt: now,
      });
      return existing._id;
    }
    return ctx.db.insert("refundPolicies", {
      eventId: args.eventId,
      policyType: "STANDARD",
      refundDeadline: args.refundDeadline,
      organizerCancelRefund: args.organizerCancelRefund ?? true,
      attendeeCancelAllowed: args.attendeeCancelAllowed ?? false,
      bookingFeeRefundable: args.bookingFeeRefundable ?? false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Admin: counts for the admin dashboard. */
export const adminDashboardCounts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await isAdmin(ctx, user._id))) throw new Error("FORBIDDEN");
    const events = await ctx.db.query("events").collect();
    const bookings = await ctx.db.query("bookings").collect();
    const tickets = await ctx.db.query("tickets").collect();
    const checkIns = await ctx.db.query("checkIns").collect();
    const organizers = await ctx.db.query("organizers").collect();
    return {
      events: events.length,
      bookings: bookings.length,
      confirmedBookings: bookings.filter((b: any) => b.status === "CONFIRMED").length,
      tickets: tickets.length,
      checkIns: checkIns.filter((c: any) => c.result === "SUCCESS").length,
      organizers: organizers.length,
    };
  },
});

/** Admin: all events regardless of status. */
export const adminListEvents = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await isAdmin(ctx, user._id))) throw new Error("FORBIDDEN");
    const events = await ctx.db.query("events").collect();
    events.sort((a: any, b: any) => b.createdAt - a.createdAt);
    return events;
  },
});
