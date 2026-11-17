import { v } from "convex/values";
import { action, httpAction, internalMutation, internalQuery, mutation } from "./_generated/server";
import { httpRouter } from "convex/server";
import { getOrCreateAppUser } from "./users";
import {
  CASHFREE_API_VERSION,
  cashfreeBaseUrl,
  extractPaymentEvent,
  isStaleTimestamp,
  mapCashfreePaymentStatus,
  verifyWebhookSignature,
} from "./lib/cashfree";
import { confirmBookingInternal, notify } from "./helpers";
import { internal } from "./_generated/api";

/*
 * Port of the initiate-payment + cashfree-webhook edge functions.
 * Secrets (CASHFREE_APP_ID / CASHFREE_SECRET_KEY) stay server-side: they are read
 * from Convex environment variables inside actions only.
 */

type IdentityCtx = { auth: any };

async function requireUser(ctx: IdentityCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");
  return identity;
}

/** Port of record_payment_attempt (called internally from initiatePayment action). */
export const recordPaymentAttempt = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    providerOrderId: v.string(),
    amountMinor: v.number(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, { bookingId, providerOrderId, amountMinor, idempotencyKey }) => {
    const now = Date.now();
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("BOOKING_NOT_FOUND");
    if (booking.expiresAt !== undefined && booking.expiresAt < now) {
      throw new Error("RESERVATION_EXPIRED");
    }
    if (booking.status !== "RESERVED" && booking.status !== "PAYMENT_PENDING") {
      throw new Error("BOOKING_NOT_PAYABLE");
    }
    if (booking.totalAmountMinor !== amountMinor) throw new Error("AMOUNT_MISMATCH");

    const existing = await ctx.db
      .query("paymentAttempts")
      .withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", idempotencyKey))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { providerOrderId, updatedAt: now });
      return existing._id;
    }

    const count = (
      await ctx.db
        .query("paymentAttempts")
        .withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId))
        .collect()
    ).length;

    const attemptId = await ctx.db.insert("paymentAttempts", {
      bookingId,
      provider: "CASHFREE",
      providerOrderId,
      attemptNumber: count + 1,
      amountMinor,
      currency: "INR",
      status: "INITIATED",
      idempotencyKey,
      initiatedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(bookingId, { status: "PAYMENT_PENDING", updatedAt: now });
    return attemptId;
  },
});

/** Look up a booking + any reusable payment attempt. */
const getBookingForPayment = internalQuery({
  args: { bookingId: v.id("bookings"), userId: v.string() },
  handler: async (ctx, { bookingId, userId }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) return null;
    const user = await ctx.db.get(booking.userId);
    if (!user || user.clerkUserId !== userId) throw new Error("FORBIDDEN");
    const attempts = await ctx.db
      .query("paymentAttempts")
      .withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId))
      .collect();
    const reusable = attempts
      .filter((a: any) => ["INITIATED", "PENDING", "AUTHORIZED", "FAILED"].includes(a.status))
      .sort((a: any, b: any) => b.initiatedAt - a.initiatedAt)[0];
    return { booking, reusable };
  },
});

const saveProviderSession = internalMutation({
  args: { attemptId: v.id("paymentAttempts"), providerSessionId: v.string() },
  handler: async (ctx, { attemptId, providerSessionId }) => {
    await ctx.db.patch(attemptId, { providerSessionId, updatedAt: Date.now() });
  },
});

/** Port of initiate-payment edge function (server-side Cashfree order create). */
export const initiatePayment = action({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }): Promise<any> => {
    const identity = await requireUser(ctx);
    const found: any = await ctx.runQuery((internal.payments as any).getBookingForPayment, {
      bookingId,
      userId: identity.subject,
    });
    if (!found) throw new Error("BOOKING_NOT_FOUND");
    const { booking, reusable } = found;

    if (booking.totalAmountMinor === 0) {
      throw new Error("FREE_BOOKING: use free confirmation");
    }
    if (booking.status !== "RESERVED" && booking.status !== "PAYMENT_PENDING") {
      throw new Error("BOOKING_NOT_PAYABLE");
    }
    if (booking.expiresAt !== undefined && booking.expiresAt < Date.now()) {
      throw new Error("RESERVATION_EXPIRED");
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secret = process.env.CASHFREE_SECRET_KEY;
    const env = process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
    if (!appId || !secret) {
      throw new Error("PAYMENTS_UNCONFIGURED: Cashfree credentials are not configured");
    }

    // Retry path: an already-created provider order reuses its session verbatim.
    if (reusable?.providerSessionId) {
      return {
        paymentAttemptId: reusable._id,
        orderId: reusable.providerOrderId,
        amountMinor: reusable.amountMinor,
        currency: "INR",
        checkoutData: {
          paymentSessionId: reusable.providerSessionId,
          orderToken: reusable.providerSessionId,
        },
      };
    }

    const orderId = `cp${bookingId.replace(/[^a-z0-9]/gi, "").slice(-30)}`;
    const amountRupees = (booking.totalAmountMinor / 100).toFixed(2);

    const cfRes = await fetch(`${cashfreeBaseUrl(env)}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": CASHFREE_API_VERSION,
        "x-client-id": appId,
        "x-client-secret": secret,
        "x-idempotency-key": `cp-order:${bookingId}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Number(amountRupees),
        order_currency: "INR",
        customer_details: {
          customer_id: booking.userId,
          customer_email: booking.attendeeEmail,
          customer_phone: booking.attendeePhone || "0000000000",
          customer_name: booking.attendeeName,
        },
        order_meta: {
          return_url: process.env.CASHFREE_RETURN_URL ?? undefined,
        },
      }),
    });
    const cfBody: any = await cfRes.json();
    if (!cfRes.ok) {
      throw new Error(`CASHFREE_ERROR: ${cfBody?.message ?? "Cashfree order failed"}`);
    }

    const attemptId: any = await ctx.runMutation((internal.payments as any).recordPaymentAttempt, {
      bookingId,
      providerOrderId: orderId,
      amountMinor: booking.totalAmountMinor,
      idempotencyKey: `pay:${bookingId}`,
    });
    // Persist the session so retries never need a second provider order.
    await ctx.runMutation((internal.payments as any).saveProviderSession, {
      attemptId,
      providerSessionId: cfBody.payment_session_id,
    });

    return {
      paymentAttemptId: attemptId,
      orderId,
      amountMinor: booking.totalAmountMinor,
      currency: "INR",
      checkoutData: {
        paymentSessionId: cfBody.payment_session_id,
        orderToken: cfBody.payment_session_id,
      },
    };
  },
});

/* ───────────────────────── apply_captured_payment ───────────────────────── */

/** Port of apply_captured_payment — internal, driven only by the webhook. */
export const applyCapturedPayment = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    providerOrderId: v.string(),
    providerPaymentId: v.string(),
    amountMinor: v.number(),
    attemptId: v.optional(v.id("paymentAttempts")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("BOOKING_NOT_FOUND");
    if (booking.totalAmountMinor !== args.amountMinor) throw new Error("AMOUNT_MISMATCH");

    if (booking.status === "CONFIRMED") {
      return { bookingId: booking._id, status: "CONFIRMED", idempotent: true };
    }

    // Late successful payment after expiry: record for reconciliation, don't drop.
    if (booking.expiresAt !== undefined && booking.expiresAt < now) {
      const reservation = booking.reservationId
        ? await ctx.db.get(booking.reservationId)
        : null;
      if (!reservation || reservation.status !== "ACTIVE") {
        await ctx.db.insert("payments", {
          bookingId: booking._id,
          paymentAttemptId: args.attemptId,
          provider: "CASHFREE",
          providerOrderId: args.providerOrderId,
          providerPaymentId: args.providerPaymentId,
          amountMinor: args.amountMinor,
          currency: "INR",
          status: "CAPTURED",
          capturedAt: now,
          metadata: { reconciliation: "LATE_SUCCESS_AFTER_EXPIRY" },
          createdAt: now,
          updatedAt: now,
        });
        await ctx.db.patch(booking._id, { status: "FAILED", updatedAt: now });
        return { bookingId: booking._id, status: "REQUIRES_RECONCILIATION" };
      }
    }

    const paymentId = await ctx.db.insert("payments", {
      bookingId: booking._id,
      paymentAttemptId: args.attemptId,
      provider: "CASHFREE",
      providerOrderId: args.providerOrderId,
      providerPaymentId: args.providerPaymentId,
      amountMinor: args.amountMinor,
      currency: "INR",
      status: "CAPTURED",
      capturedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    if (args.attemptId) {
      await ctx.db.patch(args.attemptId, {
        status: "CAPTURED",
        providerPaymentId: args.providerPaymentId,
        completedAt: now,
        updatedAt: now,
      });
    }

    const confirmed = await confirmBookingInternal(ctx, booking._id, paymentId);
    await notify(
      ctx,
      booking.userId,
      "PAYMENT_SUCCESS",
      "Payment received",
      `Payment for booking ${booking.bookingReference} was successful.`,
      { bookingId: booking._id },
    );
    return { bookingId: booking._id, status: confirmed.status, paymentId };
  },
});

/** Record a failed payment attempt (from webhook). */
export const applyFailedPayment = internalMutation({
  args: {
    providerOrderId: v.string(),
    providerPaymentId: v.string(),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, { providerOrderId, providerPaymentId, failureReason }) => {
    const now = Date.now();
    const attempt = await ctx.db
      .query("paymentAttempts")
      .withIndex("by_order", (q: any) => q.eq("providerOrderId", providerOrderId))
      .first();
    if (attempt) {
      await ctx.db.patch(attempt._id, {
        status: "FAILED",
        providerPaymentId,
        failureReason,
        completedAt: now,
        updatedAt: now,
      });
      const booking = await ctx.db.get(attempt.bookingId);
      if (booking && booking.status === "PAYMENT_PENDING") {
        await ctx.db.patch(booking._id, { status: "RESERVED", updatedAt: now });
      }
    }
    return true;
  },
});

/** Store the webhook record (idempotent by provider event id). */
const recordWebhook = internalMutation({
  args: {
    provider: v.string(),
    providerEventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
    payload: v.any(),
    signatureVerified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.providerEventId) {
      const existing = await ctx.db
        .query("paymentWebhooks")
        .withIndex("by_provider_event", (q: any) =>
          q.eq("provider", args.provider).eq("providerEventId", args.providerEventId!),
        )
        .unique();
      if (existing) return { duplicate: true, webhookId: existing._id as string };
    }
    const webhookId = await ctx.db.insert("paymentWebhooks", {
      ...args,
      processingStatus: args.signatureVerified ? "SIGNATURE_VERIFIED" : "RECEIVED",
      receivedAt: now,
      createdAt: now,
    });
    return { duplicate: false, webhookId: webhookId as string };
  },
});

const markWebhookProcessed = internalMutation({
  args: { webhookId: v.id("paymentWebhooks"), error: v.optional(v.string()) },
  handler: async (ctx, { webhookId, error }) => {
    await ctx.db.patch(webhookId, {
      processingStatus: error ? "PROCESSING_FAILED" : "PROCESSED",
      processedAt: Date.now(),
      processingError: error,
    });
  },
});

/** Resolve booking + attempt from the provider order id. */
const findByOrderId = internalQuery({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => {
    // bookings don't index provider orders; resolve via payment attempts.
    const attempt = await ctx.db
      .query("paymentAttempts")
      .withIndex("by_order", (q: any) => q.eq("providerOrderId", orderId))
      .first();
    if (!attempt) return null;
    const booking = await ctx.db.get(attempt.bookingId);
    return { booking, attempt };
  },
});

/* ───────────────────────────── HTTP webhook ───────────────────────────── */

const http = httpRouter();

http.route({
  path: "/cashfree_webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const raw = await request.text();
    const timestamp = request.headers.get("x-webhook-timestamp") ?? "";
    const signature = request.headers.get("x-webhook-signature") ?? "";
    const secret = process.env.CASHFREE_SECRET_KEY ?? "";

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "BAD_JSON" }), { status: 400 });
    }

    const verified = await verifyWebhookSignature(raw, timestamp, signature, secret);
    if (!verified || isStaleTimestamp(timestamp)) {
      return new Response(JSON.stringify({ ok: false, error: "INVALID_SIGNATURE" }), { status: 401 });
    }

    const event = extractPaymentEvent(payload);
    const { webhookId, duplicate } = await ctx.runMutation((internal.payments as any).recordWebhook, {
      provider: "CASHFREE",
      providerEventId: event.dedupeKey,
      eventType: event.eventType,
      payload,
      signatureVerified: verified,
    });

    try {
      if (duplicate) {
        return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200 });
      }

      if (!event.orderId) throw new Error("MISSING_ORDER_ID");
      const found = await ctx.runQuery((internal.payments as any).findByOrderId, { orderId: event.orderId });
      const mapped = mapCashfreePaymentStatus(event.paymentStatus);

      if (found && mapped === "CAPTURED" && event.amountMinor !== null) {
        await ctx.runMutation((internal.payments as any).applyCapturedPayment, {
          bookingId: found.booking._id,
          providerOrderId: event.orderId,
          providerPaymentId: event.cfPaymentId ?? "",
          amountMinor: event.amountMinor,
          attemptId: found.attempt._id,
        });
      } else if (found && mapped === "FAILED") {
        await ctx.runMutation((internal.payments as any).applyFailedPayment, {
          providerOrderId: event.orderId,
          providerPaymentId: event.cfPaymentId ?? "",
          failureReason: event.failureReason,
        });
      } // PENDING / AUTHORIZED / unknown statuses are recorded but not acted on.

      await ctx.runMutation((internal.payments as any).markWebhookProcessed, { webhookId });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (e: any) {
      await ctx.runMutation((internal.payments as any).markWebhookProcessed, {
        webhookId,
        error: e?.message ?? String(e),
      });
      return new Response(JSON.stringify({ ok: false, error: "PROCESSING_FAILED" }), {
        status: 200, // Cashfree retries on non-200; error is recorded instead.
      });
    }
  }),
});

export default http;

/* Convenience: get my payments (for booking history screens). */
export const listMyPayments = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateAppUser(ctx);
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    const out = [];
    for (const b of bookings) {
      const payments = await ctx.db
        .query("payments")
        .withIndex("by_booking", (q: any) => q.eq("bookingId", b._id))
        .collect();
      out.push(...payments);
    }
    return out;
  },
});
