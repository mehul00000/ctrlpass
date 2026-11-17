import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getOrCreateAppUser } from "./users";
import {
  bookingFeeMinor,
  canManageEvent,
  confirmBookingInternal,
  isAdmin,
  notify,
  releaseReservationInternal,
} from "./helpers";

/*
 * Booking lifecycle — port of reserve_booking, confirm_free_booking,
 * request_cancellation and release_expired_reservations.
 */

const RESERVATION_WINDOW_MS = 10 * 60 * 1000;
const BOOKING_TICKET_CAP = 10;

/* ─────────────────────────── reserve_booking ─────────────────────────── */

export const reserveBooking = mutation({
  args: {
    eventId: v.id("events"),
    items: v.array(
      v.object({
        ticketTypeId: v.id("ticketTypes"),
        quantity: v.number(),
      }),
    ),
    attendee: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      extraFields: v.optional(v.any()),
    }),
  },
  handler: async (ctx, { eventId, items, attendee }) => {
    const user = await getOrCreateAppUser(ctx);
    if (user.status === "DISABLED") throw new Error("ACCOUNT_DISABLED");

    const now = Date.now();
    const ev = await ctx.db.get(eventId);
    if (!ev) throw new Error("EVENT_NOT_FOUND");
    if (ev.status !== "SALES_OPEN" && ev.status !== "PUBLISHED") {
      throw new Error("SALES_CLOSED");
    }
    if (items.length < 1) throw new Error("INVALID_ITEMS");

    let ticketTotal = 0;
    let subtotal = 0;
    let paid = false;

    // Validate + lock inventory (transactional mutation ≈ SELECT ... FOR UPDATE).
    const validated: { ticketTypeId: any; quantity: number; priceMinor: number }[] = [];
    for (const item of items) {
      const { ticketTypeId, quantity } = item;
      if (quantity === null || quantity < 1) throw new Error("INVALID_QUANTITY");
      ticketTotal += quantity;
      const tt = await ctx.db.get(ticketTypeId);
      if (!tt || tt.eventId !== eventId) throw new Error("TICKET_TYPE_NOT_FOUND");
      if (tt.status !== "ACTIVE" || tt.visibility !== "VISIBLE") {
        throw new Error("TICKET_TYPE_UNAVAILABLE");
      }
      if (tt.salesStartAt !== undefined && now < tt.salesStartAt) throw new Error("SALES_NOT_STARTED");
      if (tt.salesEndAt !== undefined && now > tt.salesEndAt) throw new Error("SALES_ENDED");
      if (quantity < tt.minPerBooking || quantity > tt.maxPerBooking) throw new Error("QUANTITY_LIMIT");
      if (tt.quantity - tt.reservedQuantity - tt.soldQuantity < quantity) throw new Error("SOLD_OUT");
      if (tt.priceMinor > 0) paid = true;
      subtotal += tt.priceMinor * quantity;
      validated.push({ ticketTypeId, quantity, priceMinor: tt.priceMinor });
    }

    if (ticketTotal > BOOKING_TICKET_CAP) throw new Error("BOOKING_TICKET_CAP");
    const fee = bookingFeeMinor(ticketTotal, paid);

    const bookingReference = `BKG-${Math.random().toString(36).slice(2, 8).toUpperCase()}${now
      .toString(36)
      .slice(-4)
      .toUpperCase()}`;
    const expiresAt = now + RESERVATION_WINDOW_MS;

    const bookingId = await ctx.db.insert("bookings", {
      userId: user._id,
      eventId,
      bookingReference,
      status: "RESERVED",
      subtotalMinor: subtotal,
      bookingFeeMinor: fee,
      discountMinor: 0,
      taxMinor: 0,
      totalAmountMinor: subtotal + fee,
      currency: "INR",
      ticketCount: ticketTotal,
      attendeeName: attendee.name,
      attendeeEmail: attendee.email,
      attendeePhone: attendee.phone,
      extraFields: attendee.extraFields,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    const reservationId = await ctx.db.insert("reservations", {
      bookingId,
      status: "ACTIVE",
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(bookingId, { reservationId, updatedAt: now });

    for (const v of validated) {
      await ctx.db.insert("bookingItems", {
        bookingId,
        ticketTypeId: v.ticketTypeId,
        quantity: v.quantity,
        unitPriceMinor: v.priceMinor,
        subtotalMinor: v.priceMinor * v.quantity,
        refundedQuantity: 0,
        createdAt: now,
        updatedAt: now,
      });
      const tt: any = await ctx.db.get(v.ticketTypeId);
      if (tt) {
        await ctx.db.patch(tt._id, {
          reservedQuantity: tt.reservedQuantity + v.quantity,
          updatedAt: now,
        });
      }
    }

    await ctx.db.insert("auditLogs", {
      actorUserId: user._id,
      action: "BOOKING_RESERVED",
      resourceType: "booking",
      resourceId: bookingId,
      eventId,
      createdAt: now,
    });

    return {
      bookingId,
      reservationId,
      expiresAt,
      subtotalMinor: subtotal,
      bookingFeeMinor: fee,
      taxMinor: 0,
      totalMinor: subtotal + fee,
      currency: "INR",
      bookingReference,
    };
  },
});

/* ──────────────────────── confirm_free_booking ──────────────────────── */

export const confirmFreeBooking = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const user = await getOrCreateAppUser(ctx);
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("BOOKING_NOT_FOUND");
    if (booking.userId !== user._id && !(await isAdmin(ctx, user._id))) {
      throw new Error("FORBIDDEN");
    }
    if (booking.totalAmountMinor !== 0) throw new Error("PAYMENT_REQUIRED");
    if (booking.expiresAt !== undefined && booking.expiresAt < Date.now()) {
      await releaseReservationInternal(ctx, bookingId, "EXPIRED");
      throw new Error("RESERVATION_EXPIRED");
    }
    const confirmed = await confirmBookingInternal(ctx, bookingId);
    return { bookingId: confirmed._id, status: confirmed.status };
  },
});

/* ──────────────────────── request_cancellation ──────────────────────── */

export const requestCancellation = mutation({
  args: {
    bookingId: v.id("bookings"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { bookingId, reason }) => {
    const user = await getOrCreateAppUser(ctx);
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("BOOKING_NOT_FOUND");
    if (booking.userId !== user._id) throw new Error("FORBIDDEN");
    if (booking.status !== "CONFIRMED") throw new Error("NOT_CANCELLABLE");

    const policy = await ctx.db
      .query("refundPolicies")
      .withIndex("by_event", (q: any) => q.eq("eventId", booking.eventId))
      .first();
    if (!policy || !policy.attendeeCancelAllowed) {
      return { success: false, message: "Cancellation is not allowed for this event." };
    }
    if (policy.refundDeadline !== undefined && Date.now() > policy.refundDeadline) {
      return { success: false, message: "The cancellation window has closed." };
    }

    const now = Date.now();
    await ctx.db.patch(bookingId, { status: "CANCELLED", cancelledAt: now, updatedAt: now });
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId))
      .collect();
    for (const t of tickets) {
      if (t.status === "ACTIVE" || t.status === "PENDING") {
        await ctx.db.patch(t._id, { status: "CANCELLED", cancelledAt: now, updatedAt: now });
      }
    }
    await ctx.db.insert("refunds", {
      bookingId,
      status: "REQUESTED",
      amountMinor: booking.totalAmountMinor,
      currency: "INR",
      reason,
      createdAt: now,
      updatedAt: now,
    });
    await notify(
      ctx,
      booking.userId,
      "REFUND_INITIATED",
      "Cancellation requested",
      "Your cancellation request is being processed.",
      { bookingId },
    );
    return {
      success: true,
      message: "Cancellation requested. Refunds are processed by the backend.",
    };
  },
});

/* ───────────────────── release_expired_reservations ───────────────────── */

export const releaseExpiredReservationsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const active = await ctx.db
      .query("reservations")
      .withIndex("by_status_expires", (q: any) => q.eq("status", "ACTIVE"))
      .collect();
    let n = 0;
    for (const r of active) {
      if (r.expiresAt < now) {
        await releaseReservationInternal(ctx, r.bookingId, "EXPIRED");
        n++;
      }
    }
    return n;
  },
});

/* ───────────────────────────── queries ───────────────────────────── */

export const listMyBookings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    bookings.sort((a: any, b: any) => b.createdAt - a.createdAt);
    return bookings;
  },
});

/** Booking detail with items, tickets and event info (owner or staff). */
export const getBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const user = await getOrCreateAppUser(ctx);
    const booking = await ctx.db.get(bookingId);
    if (!booking) return null;
    const staff = await canManageEvent(ctx, booking.eventId, user._id);
    if (booking.userId !== user._id && !staff && !(await isAdmin(ctx, user._id))) {
      throw new Error("FORBIDDEN");
    }
    const items = await ctx.db
      .query("bookingItems")
      .withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId))
      .collect();
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId))
      .collect();
    const event = await ctx.db.get(booking.eventId);
    const ticketTypeNames: Record<string, string> = {};
    for (const it of items) {
      const tt = await ctx.db.get(it.ticketTypeId);
      if (tt) ticketTypeNames[it.ticketTypeId] = tt.name;
    }
    return {
      booking,
      items,
      tickets: tickets.map((t) => ({ ...t, qrToken: undefined })), // raw token only via myTicketCredentials
      eventName: event?.name,
      eventStartAt: event?.startAt,
      eventEndAt: event?.endAt,
      ticketTypeNames,
    };
  },
});

/** Owner-only raw QR tokens for printing/display. */
export const getMyBookingCredentials = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const user = await getOrCreateAppUser(ctx);
    const booking = await ctx.db.get(bookingId);
    if (!booking) return null;
    if (booking.userId !== user._id) throw new Error("FORBIDDEN");
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId))
      .collect();
    const creds: { ticketId: string; qrToken: string; reference: string; status: string }[] = [];
    for (const t of tickets) {
      const cred = await ctx.db
        .query("ticketCredentials")
        .withIndex("by_ticket", (q: any) => q.eq("ticketId", t._id))
        .unique();
      creds.push({
        ticketId: t._id,
        qrToken: cred?.qrToken ?? t.qrToken,
        reference: t.ticketReference,
        status: t.status,
      });
    }
    return creds;
  },
});

/** Staff: bookings for an event. */
export const listEventBookings = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, eventId, user._id))) throw new Error("FORBIDDEN");
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
      .collect();
    bookings.sort((a: any, b: any) => b.createdAt - a.createdAt);
    return bookings;
  },
});

/** Payments for a booking (owner or staff). */
export const listBookingPayments = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const user = await getOrCreateAppUser(ctx);
    const booking = await ctx.db.get(bookingId);
    if (!booking) return [];
    const staff = await canManageEvent(ctx, booking.eventId, user._id);
    if (booking.userId !== user._id && !staff) throw new Error("FORBIDDEN");
    return ctx.db
      .query("payments")
      .withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId))
      .collect();
  },
});
