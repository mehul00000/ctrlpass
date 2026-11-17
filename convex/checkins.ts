import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getOrCreateAppUser } from "./users";
import { canScanEvent } from "./helpers";

/* Port of checkin_scan. */
export const checkinScan = mutation({
  args: {
    eventId: v.id("events"),
    qrToken: v.string(),
    device: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, qrToken, device }) => {
    const user = await getOrCreateAppUser(ctx);
    const now = Date.now();

    if (!(await canScanEvent(ctx, eventId, user._id))) {
      await ctx.db.insert("checkIns", {
        eventId,
        scannedBy: user._id,
        result: "INVALID",
        scannedAt: now,
        deviceReference: device,
        createdAt: now,
      });
      return { success: false, status: "UNAUTHORIZED", message: "Not authorized to scan this event." };
    }

    let token = qrToken;
    if (token.startsWith("ctrlpass://ticket/")) {
      token = token.slice("ctrlpass://ticket/".length);
    } else if (token.startsWith("CP:")) {
      token = token.slice(3);
    }

    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_qr_token", (q: any) => q.eq("qrToken", `CP:${token}`))
      .unique();

    const log = (result: any, ticketId?: string) =>
      ctx.db.insert("checkIns", {
        ticketId: ticketId as any,
        eventId,
        scannedBy: user._id,
        result,
        scannedAt: now,
        deviceReference: device,
        createdAt: now,
      });

    if (!ticket) {
      await log("INVALID");
      return { success: false, status: "INVALID", message: "Ticket not recognized." };
    }
    if (ticket.eventId !== eventId) {
      await log("WRONG_EVENT", ticket._id);
      return { success: false, status: "INVALID", message: "Wrong event." };
    }
    if (ticket.status === "USED") {
      await log("DUPLICATE", ticket._id);
      return {
        success: false,
        status: "ALREADY_CHECKED_IN",
        ticketId: ticket._id,
        checkedInAt: ticket.checkedInAt,
        message: "Already checked in.",
      };
    }
    if (ticket.status === "CANCELLED") {
      await log("CANCELLED", ticket._id);
      return { success: false, status: "CANCELLED", message: "Ticket cancelled." };
    }
    if (ticket.status === "EXPIRED") {
      await log("EXPIRED", ticket._id);
      return { success: false, status: "EXPIRED", message: "Ticket expired." };
    }
    if (ticket.status !== "ACTIVE") {
      await log("INVALID", ticket._id);
      return { success: false, status: "INVALID", message: "Ticket not valid for entry." };
    }

    await ctx.db.patch(ticket._id, { status: "USED", checkedInAt: now, updatedAt: now });
    await log("SUCCESS", ticket._id);

    const tt = await ctx.db.get(ticket.ticketTypeId);
    const ev = await ctx.db.get(ticket.eventId);
    const booking = await ctx.db.get(ticket.bookingId);

    return {
      success: true,
      status: "VALID",
      ticketId: ticket._id,
      attendeeName: booking?.attendeeName ?? "",
      ticketType: tt?.name ?? "",
      eventTitle: ev?.name ?? "",
      checkedInAt: now,
      message: "Check-in successful.",
    };
  },
});

/** Scan history for an event (staff). */
export const listEventCheckIns = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canScanEvent(ctx, eventId, user._id))) throw new Error("FORBIDDEN");
    const rows = await ctx.db
      .query("checkIns")
      .withIndex("by_event_time", (q: any) => q.eq("eventId", eventId))
      .collect();
    rows.sort((a: any, b: any) => b.scannedAt - a.scannedAt);
    return rows;
  },
});

/** My tickets (attendee view across events). */
export const listMyTickets = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_owner", (q: any) => q.eq("ownerUserId", user._id))
      .collect();
    tickets.sort((a: any, b: any) => b.createdAt - a.createdAt);
    const out = [];
    for (const t of tickets) {
      const ev = await ctx.db.get(t.eventId);
      const tt = await ctx.db.get(t.ticketTypeId);
      const cred = await ctx.db
        .query("ticketCredentials")
        .withIndex("by_ticket", (q: any) => q.eq("ticketId", t._id))
        .unique();
      out.push({
        ...t,
        qrToken: cred?.qrToken ?? t.qrToken,
        eventName: ev?.name,
        eventStartAt: ev?.startAt,
        eventEndAt: ev?.endAt,
        ticketTypeName: tt?.name,
      });
    }
    return out;
  },
});
