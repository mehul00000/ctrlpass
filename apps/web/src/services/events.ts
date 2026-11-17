import { api } from "../../../../convex/_generated/api";
import { authedClient, convexErrorMessage, isConvexConfigured, snakeize } from "@/lib/convex";
import { Event } from "@ctrlpass/types";

export const eventService = {
  async listPublished(): Promise<Event[]> {
    if (!isConvexConfigured) return [];
    const data = await (await authedClient()).query(api.events.listPublicEvents, {});
    return (snakeize<Event[]>(data) || []) as unknown as Event[];
  },

  async listOrganizerEvents(organizerId?: string): Promise<Event[]> {
    if (!isConvexConfigured) return [];
    const client = await authedClient();
    if (organizerId) {
      const data = await client.query(api.events.listMyOrganizerEvents, { organizerId } as any);
      return (snakeize<Event[]>(data) || []) as unknown as Event[];
    }
    // All events the signed-in user is allowed to manage.
    const data = await client.query(api.events.listManagedEvents, {});
    return (snakeize<Event[]>(data) || []) as unknown as Event[];
  },

  async listAllEventsForAdmin(): Promise<Event[]> {
    if (!isConvexConfigured) return [];
    try {
      const data = await (await authedClient()).query(api.events.adminListEvents, {});
      return (snakeize<Event[]>(data) || []) as unknown as Event[];
    } catch (e) {
      // Non-admins fall back to their own manageable set.
      if (String((e as Error)?.message).includes("FORBIDDEN")) {
        return this.listOrganizerEvents();
      }
      throw e;
    }
  },

  async getById(id: string): Promise<Event | null> {
    if (!isConvexConfigured) return null;
    const data = await (await authedClient()).query(api.events.getPublicEvent, { eventId: id } as any);
    if (!data) return null;
    const shaped = snakeize<any>(data);
    return {
      ...shaped.event,
      venue: shaped.venue,
      organizer: shaped.organizer,
      ticket_types: shaped.ticket_types,
    } as unknown as Event;
  },

  async createEvent(
    payload: Partial<Event> & { venue_name?: string; venue_city?: string },
  ): Promise<Event> {
    if (!isConvexConfigured) {
      throw new Error("Convex is not configured. Connect the backend to save events.");
    }
    const client = await authedClient();

    let organizerId = (payload as any).organizer_id as string | undefined;
    if (!organizerId) {
      const mine = await client.query(api.organizers.listMyOrganizers, {});
      const active = (mine as any[])[0];
      if (!active) {
        throw new Error(
          "No active organizer membership for your account. Bootstrap an organizer first.",
        );
      }
      organizerId = active.organizer.id as string;
    }

    let venueId = (payload as any).venue_id as string | undefined;
    if (!venueId && (payload.venue_name || payload.venue_city)) {
      venueId = (await client.mutation(api.events.createVenue, {
        name: payload.venue_name || "Main Event Grounds",
        city: payload.venue_city || "Bengaluru",
      } as any)) as unknown as string;
    }

    const eventId = (await client.mutation(api.events.createEvent, {
      organizerId: organizerId!,
      name: payload.name || "Untitled event",
      shortDescription:
        payload.short_description ||
        (payload.description ? payload.description.slice(0, 140) : payload.name || ""),
      description: payload.description || "",
      category: payload.category || "OTHER",
      coverImageUrl: (payload as any).cover_image_url,
      format: (payload.format as "PHYSICAL" | "ONLINE" | "HYBRID") || "PHYSICAL",
      visibility: (payload as any).visibility || "PUBLIC",
      venueId,
      startAt: new Date((payload as any).start_at).getTime(),
      endAt: new Date((payload as any).end_at).getTime(),
      doorsOpenAt: (payload as any).doors_open_at
        ? new Date((payload as any).doors_open_at).getTime()
        : undefined,
      capacity: (payload as any).capacity,
    } as any)) as unknown as string;

    const created = await client.query(api.events.getPublicEvent, { eventId } as any);
    if (!created) {
      // Drafts are not publicly readable — return the minimum shape.
      return {
        id: eventId,
        organizer_id: organizerId,
        venue_id: venueId,
        ...payload,
      } as unknown as Event;
    }
    const shaped = snakeize<any>(created);
    return {
      ...shaped.event,
      venue: shaped.venue,
      organizer: shaped.organizer,
      ticket_types: shaped.ticket_types,
    } as unknown as Event;
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    if (!isConvexConfigured) throw new Error("Convex is not configured.");
    const client = await authedClient();
    await client.mutation(api.events.updateEvent, {
      eventId: id,
      name: updates.name,
      shortDescription: (updates as any).short_description,
      description: updates.description,
      category: updates.category,
      coverImageUrl: (updates as any).cover_image_url,
      format: updates.format as any,
      visibility: (updates as any).visibility as any,
      venueId: (updates as any).venue_id,
      startAt: (updates as any).start_at ? new Date((updates as any).start_at).getTime() : undefined,
      endAt: (updates as any).end_at ? new Date((updates as any).end_at).getTime() : undefined,
      doorsOpenAt: (updates as any).doors_open_at
        ? new Date((updates as any).doors_open_at).getTime()
        : undefined,
      capacity: (updates as any).capacity,
    } as any);
    const fresh = await client.query(api.events.getPublicEvent, { eventId: id } as any);
    if (!fresh) return { ...updates, id } as unknown as Event;
    const shaped = snakeize<any>(fresh);
    return { ...shaped.event, venue: shaped.venue, organizer: shaped.organizer } as unknown as Event;
  },

  async updateEventStatus(id: string, status: string): Promise<void> {
    if (!isConvexConfigured) throw new Error("Convex is not configured.");
    if (status === "CANCELLED") {
      (await authedClient()).mutation(api.staff.cancelEvent, { eventId: id } as any);
      return;
    }
    throw new Error(
      `Status transition to ${status} must go through the lifecycle actions (transitionEvent).`,
    );
  },

  // Lifecycle transitions — enforced server-side (status, role, audit).
  async transitionEvent(
    id: string,
    action: "submit" | "publish" | "open_sales" | "close_sales",
  ): Promise<void> {
    if (!isConvexConfigured) throw new Error("Convex is not configured.");
    const client = await authedClient();
    const fn = {
      submit: api.events.submitEvent,
      publish: api.events.publishEvent,
      open_sales: api.events.openSales,
      close_sales: api.events.closeSales,
    }[action];
    await client.mutation(fn, { eventId: id } as any);
  },

  async adminReviewEvent(id: string, approve: boolean, reason?: string): Promise<void> {
    if (!isConvexConfigured) throw new Error("Convex is not configured.");
    (await authedClient()).mutation(api.events.adminReviewEvent, {
      eventId: id,
      approve,
      reason,
    } as any);
  },
};
