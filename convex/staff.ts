import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getOrCreateAppUser } from "./users";
import { canManageEvent, isAdmin, isOrganizerMember, notify } from "./helpers";

/* Aggregate queries used by the organizer portal + admin command center UI. */

async function organizerEventIds(ctx: any, organizerId: any): Promise<string[]> {
  const events = await ctx.db
    .query("events")
    .withIndex("by_organizer", (q: any) => q.eq("organizerId", organizerId))
    .collect();
  return events.map((e: any) => e._id);
}

/** Bookings across all of an organizer's events (or globally for admins). */
export const listOrganizerBookings = query({
  args: { organizerId: v.optional(v.id("organizers")) },
  handler: async (ctx, { organizerId }) => {
    const user = await getOrCreateAppUser(ctx);
    let eventIds: string[];
    if (organizerId) {
      if (!(await isOrganizerMember(ctx, organizerId, user._id)) && !(await isAdmin(ctx, user._id))) {
        throw new Error("FORBIDDEN");
      }
      eventIds = await organizerEventIds(ctx, organizerId);
    } else {
      if (!(await isAdmin(ctx, user._id))) throw new Error("FORBIDDEN");
      eventIds = (await ctx.db.query("events").collect()).map((e: any) => e._id);
    }
    const bookings = (await ctx.db.query("bookings").collect()).filter(
      (b: any) => eventIds.includes(b.eventId),
    );
    bookings.sort((a: any, b: any) => b.createdAt - a.createdAt);
    return bookings.slice(0, 500);
  },
});

/** Tickets across events (staff). Includes type + booking context. */
export const listStaffTickets = query({
  args: { eventId: v.optional(v.id("events")) },
  handler: async (ctx, { eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    const all = await ctx.db.query("tickets").collect();
    const tickets = await Promise.all(
      all
        .filter((t: any) => !eventId || t.eventId === eventId)
        .slice(0, 1000)
        .map(async (t: any) => {
          const manage = await canManageEvent(ctx, t.eventId, user._id);
          return { allowed: manage, t };
        }),
    );
    const visible = tickets.filter((x) => x.allowed).map((x) => x.t);
    visible.sort((a: any, b: any) => b.createdAt - a.createdAt);
    const out = [];
    for (const t of visible.slice(0, 300)) {
      const tt: any = await ctx.db.get(t.ticketTypeId);
      const booking: any = await ctx.db.get(t.bookingId);
      out.push({
        ...t,
        ticketType: tt ? { name: tt.name, priceMinor: tt.priceMinor } : null,
        booking: booking
          ? { attendeeName: booking.attendeeName, attendeeEmail: booking.attendeeEmail }
          : null,
      });
    }
    return out;
  },
});

/** Check-in history across events (staff). */
export const listStaffCheckIns = query({
  args: { eventId: v.optional(v.id("events")) },
  handler: async (ctx, { eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    const all = await ctx.db.query("checkIns").collect();
    const rows = await Promise.all(
      all
        .filter((c: any) => !eventId || c.eventId === eventId)
        .slice(0, 1000)
        .map(async (c: any) => {
          const allowed = await canManageEvent(ctx, c.eventId, user._id) ||
            (await isAdmin(ctx, user._id));
          return { allowed, c };
        }),
    );
    const visible = rows.filter((x) => x.allowed).map((x) => x.c);
    visible.sort((a: any, b: any) => b.scannedAt - a.scannedAt);
    const out = [];
    for (const c of visible.slice(0, 300)) {
      const ticket: any = c.ticketId ? await ctx.db.get(c.ticketId) : null;
      const tt: any = ticket ? await ctx.db.get(ticket.ticketTypeId) : null;
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q: any) => q.eq("userId", c.scannedBy))
        .unique();
      out.push({
        ...c,
        ticket: ticket ? { ticketReference: ticket.ticketReference, status: ticket.status } : null,
        ticketType: tt ? { name: tt.name } : null,
        scanner: profile ? { fullName: profile.fullName } : null,
      });
    }
    return out;
  },
});

/** Refunds visible to staff/admin. */
export const listStaffRefunds = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const admin = await isAdmin(ctx, user._id);
    const refunds = await ctx.db.query("refunds").collect();
    refunds.sort((a: any, b: any) => b.createdAt - a.createdAt);
    const out = [];
    for (const r of refunds.slice(0, 300)) {
      const booking = await ctx.db.get(r.bookingId);
      if (!booking) continue;
      const manage = await canManageEvent(ctx, booking.eventId, user._id);
      const mine = booking.userId === user._id;
      if (!admin && !manage && !mine) continue;
      out.push({
        ...r,
        booking: {
          bookingReference: booking.bookingReference,
          totalAmountMinor: booking.totalAmountMinor,
          attendeeName: booking.attendeeName,
        },
      });
    }
    return out;
  },
});

/** Event members with VOLUNTEER/SCANNER roles across an organizer's events. */
export const listVolunteers = query({
  args: { organizerId: v.optional(v.id("organizers")), eventId: v.optional(v.id("events")) },
  handler: async (ctx, { organizerId, eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    const myMemberships = await ctx.db
      .query("organizerMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    const admin = await isAdmin(ctx, user._id);
    const myOrgIds = new Set(
      myMemberships.filter((m: any) => m.status === "ACTIVE").map((m: any) => m.organizerId),
    );
    const all = await ctx.db.query("eventMembers").collect();
    const filtered = [];
    for (const m of all) {
      if (!["VOLUNTEER", "SCANNER"].includes(m.role)) continue;
      if (m.status !== "ACTIVE") continue;
      if (eventId && m.eventId !== eventId) continue;
      const ev = await ctx.db.get(m.eventId);
      if (!ev) continue;
      const staff =
        admin || myOrgIds.has(ev.organizerId) || (await isOrganizerMember(ctx, ev.organizerId, user._id));
      if (!staff) continue;
      if (organizerId && ev.organizerId !== organizerId) continue;
      filtered.push({ ...m, event: { name: ev.name } });
    }
    filtered.sort((a: any, b: any) => b.createdAt - a.createdAt);
    return filtered;
  },
});

/** Volunteer invitations across an organizer's events (staff). */
export const listAllInvitations = query({
  args: { eventId: v.optional(v.id("events")) },
  handler: async (ctx, { eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    const admin = await isAdmin(ctx, user._id);
    const members = await ctx.db
      .query("organizerMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    const myOrgIds = new Set(members.filter((m: any) => m.status === "ACTIVE").map((m: any) => m.organizerId));

    const invs = await ctx.db.query("volunteerInvitations").collect();
    const out = [];
    for (const inv of invs) {
      if (eventId && inv.eventId !== eventId) continue;
      const ev = await ctx.db.get(inv.eventId);
      if (!ev) continue;
      if (!admin && !myOrgIds.has(ev.organizerId) && !(await canManageEvent(ctx, inv.eventId, user._id))) continue;
      out.push({ ...inv, event: { name: ev.name } });
    }
    out.sort((a: any, b: any) => b.createdAt - a.createdAt);
    return out;
  },
});

/** Organizer finance aggregates (confirmed bookings + captured payments). */
export const getFinanceAggregates = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const admin = await isAdmin(ctx, user._id);
    const members = await ctx.db
      .query("organizerMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    const myOrgIds = new Set(members.filter((m: any) => m.status === "ACTIVE").map((m: any) => m.organizerId));
    if (!admin && myOrgIds.size === 0) {
      return { grossMinor: 0, feesMinor: 0, netMinor: 0, confirmedBookings: 0, successfulPayments: 0, paymentsMinor: 0 };
    }

    const bookings = await ctx.db.query("bookings").collect();
    const visibleBookings: any[] = [];
    for (const b of bookings) {
      const ev = await ctx.db.get(b.eventId);
      if (admin || (ev && myOrgIds.has(ev.organizerId))) visibleBookings.push(b);
    }
    const confirmed = visibleBookings.filter((b: any) => b.status === "CONFIRMED");
    const payments = await ctx.db.query("payments").collect();
    const visiblePayments = payments.filter((p: any) =>
      visibleBookings.some((b: any) => b._id === p.bookingId),
    );

    const grossMinor = confirmed.reduce((s: number, b: any) => s + (b.totalAmountMinor || 0), 0);
    const feesMinor = confirmed.reduce((s: number, b: any) => s + (b.bookingFeeMinor || 0), 0);
    const paymentsMinor = visiblePayments
      .filter((p: any) => p.status === "CAPTURED")
      .reduce((s: number, p: any) => s + (p.amountMinor || 0), 0);

    return {
      grossMinor,
      feesMinor,
      netMinor: Math.max(0, grossMinor - feesMinor),
      confirmedBookings: confirmed.length,
      successfulPayments: visiblePayments.filter((p: any) => p.status === "CAPTURED").length,
      paymentsMinor,
    };
  },
});

/** Organizer announcement to all confirmed attendees of an event. */
export const announceToEventAttendees = mutation({
  args: {
    eventId: v.id("events"),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, { eventId, title, body }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, eventId, user._id)) && !(await isAdmin(ctx, user._id))) {
      throw new Error("FORBIDDEN");
    }
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
      .collect();
    const userIds = Array.from(new Set(bookings.filter((b: any) => b.status === "CONFIRMED").map((b: any) => b.userId)));
    if (userIds.length === 0) throw new Error("No confirmed attendees to notify for this event.");
    for (const uid of userIds) {
      await notify(ctx, uid, "EVENT_ANNOUNCEMENT", title, body, { eventId });
    }
    return { recipientCount: userIds.length };
  },
});

/* ─────────────────────────── admin queries ─────────────────────────── */

export const adminListOrganizers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await isAdmin(ctx, user._id))) throw new Error("FORBIDDEN");
    const organizers = await ctx.db.query("organizers").collect();
    organizers.sort((a: any, b: any) => b.createdAt - a.createdAt);
    return organizers;
  },
});

export const adminListUsers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await isAdmin(ctx, user._id))) throw new Error("FORBIDDEN");
    const users = await ctx.db.query("appUsers").collect();
    users.sort((a: any, b: any) => b.createdAt - a.createdAt);
    const out = [];
    for (const u of users.slice(0, 300)) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q: any) => q.eq("userId", u._id))
        .unique();
      out.push({ ...u, profile });
    }
    return out;
  },
});

export const adminListAuditLogs = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await isAdmin(ctx, user._id))) throw new Error("FORBIDDEN");
    const logs = await ctx.db.query("auditLogs").collect();
    logs.sort((a: any, b: any) => b.createdAt - a.createdAt);
    return logs.slice(0, 100);
  },
});

/** Cancel an event (the one transition without a dedicated RPC in the old schema). */
export const cancelEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, eventId, user._id)) && !(await isAdmin(ctx, user._id))) {
      throw new Error("FORBIDDEN");
    }
    const now = Date.now();
    await ctx.db.patch(eventId, { status: "CANCELLED", cancelledAt: now, updatedAt: now });
    return true;
  },
});

/** Delete a ticket type (only while nothing is sold/reserved). */
export const deleteTicketType = mutation({
  args: { ticketTypeId: v.id("ticketTypes") },
  handler: async (ctx, { ticketTypeId }) => {
    const tt = await ctx.db.get(ticketTypeId);
    if (!tt) return true;
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, tt.eventId, user._id)) && !(await isAdmin(ctx, user._id))) {
      throw new Error("FORBIDDEN");
    }
    if (tt.soldQuantity > 0 || tt.reservedQuantity > 0) {
      throw new Error("TICKET_TYPE_IN_USE");
    }
    await ctx.db.delete(ticketTypeId);
    return true;
  },
});
