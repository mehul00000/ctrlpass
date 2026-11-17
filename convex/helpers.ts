import type { Id } from "./_generated/dataModel";

/*
 * Ported Postgres helper functions: is_admin, has_active_role,
 * is_organizer_member, can_manage_event, can_scan_event, booking_fee_minor,
 * plus internal booking internals (_notify, _issue_tickets, _confirm_booking,
 * _release_reservation).
 */

export function bookingFeeMinor(ticketCount: number, isPaid: boolean): number {
  if (!isPaid || ticketCount <= 0) return 0;
  return Math.min(3000 + 500 * (ticketCount - 1), 6000);
}

export function eventIsPubliclyListed(
  status: string,
  visibility: string,
): boolean {
  return (
    visibility === "PUBLIC" &&
    ["PUBLISHED", "SALES_OPEN", "SALES_CLOSED", "ONGOING", "COMPLETED"].includes(status)
  );
}

export type AuthCtx = { db: any; auth: any };

export async function getUserIdentitySubject(ctx: AuthCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");
  return identity.subject;
}

export async function isAdmin(ctx: AuthCtx, userId: Id<"appUsers">): Promise<boolean> {
  const role = await ctx.db
    .query("userRoles")
    .withIndex("by_user_role", (q: any) =>
      q.eq("userId", userId).eq("role", "ADMIN"),
    )
    .unique();
  return !!role && role.status === "ACTIVE";
}

export async function hasActiveRole(
  ctx: AuthCtx,
  userId: Id<"appUsers">,
  role: string,
): Promise<boolean> {
  const row = await ctx.db
    .query("userRoles")
    .withIndex("by_user_role", (q: any) => q.eq("userId", userId).eq("role", role))
    .unique();
  return !!row && row.status === "ACTIVE";
}

export async function getActiveRoleNames(
  ctx: AuthCtx,
  userId: Id<"appUsers">,
): Promise<string[]> {
  const roles = await ctx.db
    .query("userRoles")
    .withIndex("by_user_role", (q: any) => q.eq("userId", userId))
    .collect();
  return roles.filter((r: any) => r.status === "ACTIVE").map((r: any) => r.role);
}

export async function isOrganizerMember(
  ctx: AuthCtx,
  organizerId: Id<"organizers">,
  userId: Id<"appUsers">,
): Promise<boolean> {
  const rows = await ctx.db
    .query("organizerMembers")
    .withIndex("by_organizer_user", (q: any) =>
      q.eq("organizerId", organizerId).eq("userId", userId),
    )
    .collect();
  return rows.some((m: any) => m.status === "ACTIVE");
}

export async function canManageEvent(
  ctx: AuthCtx,
  eventId: Id<"events">,
  userId: Id<"appUsers">,
): Promise<boolean> {
  const ev = await ctx.db.get(eventId);
  if (!ev) return false;
  if (await isAdmin(ctx, userId)) return true;
  if (await isOrganizerMember(ctx, ev.organizerId, userId)) return true;
  const member = await ctx.db
    .query("eventMembers")
    .withIndex("by_event_user_role", (q: any) =>
      q.eq("eventId", eventId).eq("userId", userId).eq("role", "EVENT_MANAGER"),
    )
    .unique();
  return !!member && member.status === "ACTIVE";
}

export async function canScanEvent(
  ctx: AuthCtx,
  eventId: Id<"events">,
  userId: Id<"appUsers">,
): Promise<boolean> {
  if (await canManageEvent(ctx, eventId, userId)) return true;
  const members = await ctx.db
    .query("eventMembers")
    .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
    .collect();
  return members.some(
    (m: any) =>
      m.userId === userId &&
      m.status === "ACTIVE" &&
      (m.role === "VOLUNTEER" || m.role === "SCANNER"),
  );
}

/** _notify: insert an in-app notification + delivery row. */
export async function notify(
  ctx: AuthCtx,
  userId: Id<"appUsers">,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const now = Date.now();
  const nid = await ctx.db.insert("notifications", {
    userId,
    type,
    title,
    body,
    data: data ?? {},
    deliveredAt: now,
    createdAt: now,
  });
  await ctx.db.insert("notificationDeliveries", {
    notificationId: nid,
    channel: "IN_APP",
    status: "DELIVERED",
    deliveredAt: now,
    createdAt: now,
  });
}

/** _issue_tickets: create tickets for every booking item, move reserved → sold. */
export async function issueTickets(
  ctx: AuthCtx,
  bookingId: Id<"bookings">,
): Promise<void> {
  const booking = await ctx.db.get(bookingId);
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  const now = Date.now();
  const items = await ctx.db
    .query("bookingItems")
    .withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId))
    .collect();

  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      const token = randomHex(24);
      const ticketId = await ctx.db.insert("tickets", {
        bookingId,
        bookingItemId: item._id,
        ticketTypeId: item.ticketTypeId,
        eventId: booking.eventId,
        ownerUserId: booking.userId,
        ticketReference: `CP-${new Date().getFullYear()}-${token.slice(0, 6).toUpperCase()}`,
        qrToken: `CP:${token}`,
        status: "ACTIVE",
        issuedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("ticketCredentials", {
        ticketId,
        qrToken: `CP:${token}`,
        createdAt: now,
      });
    }
    const tt = await ctx.db.get(item.ticketTypeId);
    if (tt) {
      await ctx.db.patch(tt._id, {
        reservedQuantity: Math.max(0, tt.reservedQuantity - item.quantity),
        soldQuantity: tt.soldQuantity + item.quantity,
        updatedAt: now,
      });
    }
  }
}

/** _confirm_booking: consume reservation, issue tickets, ledger + notify. */
export async function confirmBookingInternal(
  ctx: AuthCtx,
  bookingId: Id<"bookings">,
  paymentId?: Id<"payments">,
): Promise<any> {
  const booking = await ctx.db.get(bookingId);
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (booking.status === "CONFIRMED") return booking;
  if (booking.status !== "RESERVED" && booking.status !== "PAYMENT_PENDING") {
    throw new Error("BOOKING_NOT_CONFIRMABLE");
  }

  const now = Date.now();
  const event = await ctx.db.get(booking.eventId);

  const reservation = booking.reservationId
    ? await ctx.db.get(booking.reservationId)
    : null;
  if (reservation && reservation.status === "ACTIVE") {
    await ctx.db.patch(reservation._id, { status: "CONSUMED", updatedAt: now });
  }

  await issueTickets(ctx, bookingId);

  await ctx.db.patch(bookingId, {
    status: "CONFIRMED",
    confirmedAt: now,
    updatedAt: now,
  });
  const confirmed = await ctx.db.get(bookingId);

  await ctx.db.insert("ledgerEntries", {
    organizerId: event?.organizerId,
    eventId: booking.eventId,
    bookingId,
    paymentId,
    entryType: "TICKET_REVENUE",
    direction: "CREDIT",
    amountMinor: booking.subtotalMinor,
    currency: "INR",
    referenceType: "booking",
    referenceId: bookingId,
    description: "Ticket subtotal",
    createdAt: now,
  });
  if (booking.bookingFeeMinor > 0) {
    await ctx.db.insert("ledgerEntries", {
      organizerId: event?.organizerId,
      eventId: booking.eventId,
      bookingId,
      paymentId,
      entryType: "BOOKING_FEE",
      direction: "CREDIT",
      amountMinor: booking.bookingFeeMinor,
      currency: "INR",
      referenceType: "booking",
      referenceId: bookingId,
      description: "CtrlPass booking fee",
      createdAt: now,
    });
  }

  await notify(
    ctx,
    booking.userId,
    "BOOKING_CONFIRMED",
    "Booking confirmed",
    `Your booking ${booking.bookingReference} is confirmed.`,
    { bookingId, eventId: booking.eventId },
  );
  await notify(
    ctx,
    booking.userId,
    "TICKET_ISSUED",
    "Tickets issued",
    "Your CtrlPass tickets are ready.",
    { bookingId },
  );

  return confirmed;
}

/** _release_reservation: release inventory hold and finalise booking status. */
export async function releaseReservationInternal(
  ctx: AuthCtx,
  bookingId: Id<"bookings">,
  bookingStatus: string,
): Promise<void> {
  const now = Date.now();
  const booking = await ctx.db.get(bookingId);
  if (!booking) return;

  const reservation = booking.reservationId
    ? await ctx.db.get(booking.reservationId)
    : null;
  if (reservation && reservation.status === "ACTIVE") {
    await ctx.db.patch(reservation._id, {
      status: bookingStatus === "EXPIRED" ? "EXPIRED" : "RELEASED",
      releasedAt: now,
      updatedAt: now,
    });
  }

  const items = await ctx.db
    .query("bookingItems")
    .withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId))
    .collect();
  for (const item of items) {
    const tt = await ctx.db.get(item.ticketTypeId);
    if (tt && tt.reservedQuantity >= item.quantity) {
      await ctx.db.patch(tt._id, {
        reservedQuantity: tt.reservedQuantity - item.quantity,
        updatedAt: now,
      });
    }
  }

  if (["RESERVED", "PAYMENT_PENDING", "CREATED"].includes(booking.status)) {
    await ctx.db.patch(bookingId, { status: bookingStatus as any, updatedAt: now });
  }
}

function randomHex(bytes: number): string {
  let hex = "";
  for (let i = 0; i < bytes * 2; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return hex;
}
