import { api } from "../../../../convex/_generated/api";
import { authedClient, isConvexConfigured, snakeize } from "@/lib/convex";
import { TicketType } from "@ctrlpass/types";

export interface CreateTicketTypePayload {
  event_id: string;
  name: string;
  price_minor: number; // paise
  quantity: number;
  max_per_booking: number;
  status?: string;
  visibility?: string;
}

export const ticketTypeService = {
  async create(payload: CreateTicketTypePayload): Promise<TicketType> {
    if (!isConvexConfigured) {
      throw new Error("Convex is not configured.");
    }
    const data = await (await authedClient()).mutation(api.ticketTypes.create, {
      eventId: payload.event_id,
      name: payload.name,
      priceMinor: payload.price_minor,
      quantity: payload.quantity,
      maxPerBooking: payload.max_per_booking,
      visibility: payload.visibility === "HIDDEN" ? "HIDDEN" : "VISIBLE",
    } as any);
    return snakeize(data) as unknown as TicketType;
  },

  async listByEvent(eventId: string): Promise<TicketType[]> {
    if (!isConvexConfigured) return [];
    const data = await (await authedClient()).query(api.ticketTypes.listForEvent, { eventId } as any);
    return (snakeize<TicketType[]>(data) ?? []) as unknown as TicketType[];
  },

  async remove(id: string): Promise<void> {
    if (!isConvexConfigured) return;
    (await authedClient()).mutation(api.staff.deleteTicketType, { ticketTypeId: id } as any);
  },
};
