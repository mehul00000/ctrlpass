import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getOrCreateAppUser } from "./users";
import { canManageEvent } from "./helpers";

/** Public: ticket types for an on-sale event. */
export const listForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const tts = await ctx.db
      .query("ticketTypes")
      .withIndex("by_event_visibility_status", (q: any) =>
        q.eq("eventId", eventId).eq("visibility", "VISIBLE").eq("status", "ACTIVE"),
      )
      .collect();
    tts.sort((a: any, b: any) => a.priceMinor - b.priceMinor);
    return tts;
  },
});

/** Staff: all ticket types incl. hidden ones. */
export const listForEventStaff = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, eventId, user._id))) throw new Error("FORBIDDEN");
    const tts = await ctx.db
      .query("ticketTypes")
      .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
      .collect();
    tts.sort((a: any, b: any) => a.createdAt - b.createdAt);
    return tts;
  },
});

export const create = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    description: v.optional(v.string()),
    priceMinor: v.number(),
    quantity: v.number(),
    minPerBooking: v.optional(v.number()),
    maxPerBooking: v.optional(v.number()),
    salesStartAt: v.optional(v.number()),
    salesEndAt: v.optional(v.number()),
    visibility: v.optional(v.union(v.literal("VISIBLE"), v.literal("HIDDEN"))),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, args.eventId, user._id))) throw new Error("FORBIDDEN");
    if (args.priceMinor < 0 || args.quantity < 0) throw new Error("INVALID_INPUT");
    const now = Date.now();
    return ctx.db.insert("ticketTypes", {
      eventId: args.eventId,
      name: args.name,
      description: args.description,
      priceMinor: args.priceMinor,
      currency: "INR",
      quantity: args.quantity,
      reservedQuantity: 0,
      soldQuantity: 0,
      minPerBooking: args.minPerBooking ?? 1,
      maxPerBooking: args.maxPerBooking ?? 10,
      salesStartAt: args.salesStartAt,
      salesEndAt: args.salesEndAt,
      visibility: args.visibility ?? "VISIBLE",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    ticketTypeId: v.id("ticketTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    priceMinor: v.optional(v.number()),
    quantity: v.optional(v.number()),
    minPerBooking: v.optional(v.number()),
    maxPerBooking: v.optional(v.number()),
    salesStartAt: v.optional(v.number()),
    salesEndAt: v.optional(v.number()),
    visibility: v.optional(v.union(v.literal("VISIBLE"), v.literal("HIDDEN"))),
    status: v.optional(v.union(v.literal("ACTIVE"), v.literal("DISABLED"))),
  },
  handler: async (ctx, args) => {
    const tt = await ctx.db.get(args.ticketTypeId);
    if (!tt) throw new Error("TICKET_TYPE_NOT_FOUND");
    const user = await getOrCreateAppUser(ctx);
    if (!(await canManageEvent(ctx, tt.eventId, user._id))) throw new Error("FORBIDDEN");
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, val] of Object.entries(args)) {
      if (k !== "ticketTypeId" && val !== undefined) patch[k] = val;
    }
    const q = patch.quantity !== undefined ? (patch.quantity as number) : tt.quantity;
    const r = patch.reservedQuantity !== undefined ? tt.reservedQuantity : tt.reservedQuantity;
    const s = tt.soldQuantity;
    if (r + s > q) throw new Error("QUANTITY_BELOW_SOLD");
    await ctx.db.patch(tt._id, patch);
    return true;
  },
});
