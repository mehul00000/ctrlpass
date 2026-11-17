import { api } from "../../../../convex/_generated/api";
import { authedClient, isConvexConfigured, snakeize } from "@/lib/convex";
import { Booking, Ticket } from "@ctrlpass/types";

export const bookingService = {
  async listOrders(organizerId?: string): Promise<Booking[]> {
    if (!isConvexConfigured) return [];
    const data = await (await authedClient()).query(api.staff.listOrganizerBookings, {
      organizerId,
    } as any);
    const rows = snakeize<any[]>(data) || [];
    return rows.map((b) => ({
      ...b,
      event: b.event ?? undefined,
    })) as unknown as Booking[];
  },

  async listCheckIns(eventId?: string): Promise<Record<string, unknown>[]> {
    if (!isConvexConfigured) return [];
    const data = await (await authedClient()).query(api.staff.listStaffCheckIns, { eventId } as any);
    return snakeize<Record<string, unknown>[]>(data) || [];
  },

  async listTickets(eventId?: string): Promise<Ticket[]> {
    if (!isConvexConfigured) return [];
    const data = await (await authedClient()).query(api.staff.listStaffTickets, { eventId } as any);
    return (snakeize<Ticket[]>(data) || []) as unknown as Ticket[];
  },

  async listRefunds(): Promise<any[]> {
    if (!isConvexConfigured) return [];
    const data = await (await authedClient()).query(api.staff.listStaffRefunds, {});
    return snakeize<any[]>(data) || [];
  },

  async createReservation(payload: {
    event_id: string;
    items: { ticket_type_id: string; quantity: number }[];
    attendee: {
      name: string;
      email: string;
      phone?: string;
      extra_fields?: Record<string, string>;
    };
  }) {
    if (!isConvexConfigured) {
      throw new Error("Convex is not configured. Connect the backend to book passes.");
    }
    const result = await (await authedClient()).mutation(api.bookings.reserveBooking, {
      eventId: payload.event_id,
      items: payload.items.map((i) => ({
        ticketTypeId: i.ticket_type_id,
        quantity: i.quantity,
      })),
      attendee: {
        name: payload.attendee.name,
        email: payload.attendee.email,
        phone: payload.attendee.phone,
        extraFields: payload.attendee.extra_fields,
      },
    } as any);
    const shaped = snakeize<any>(result);
    return {
      booking_id: shaped.booking_id,
      reservation_id: shaped.reservation_id,
      booking_reference: shaped.booking_reference,
      subtotal_minor: shaped.subtotal_minor,
      booking_fee_minor: shaped.booking_fee_minor,
      tax_minor: shaped.tax_minor,
      total_minor: shaped.total_minor,
      expires_at: shaped.expires_at,
    };
  },

  async confirmFree(bookingId: string) {
    if (!isConvexConfigured) throw new Error("Convex is not configured.");
    const result = await (await authedClient()).mutation(api.bookings.confirmFreeBooking, {
      bookingId,
    } as any);
    return { booking_id: (result as any).bookingId, status: (result as any).status };
  },

  async initiatePayment(bookingId: string) {
    if (!isConvexConfigured) throw new Error("Convex is not configured.");
    const data = await (await authedClient()).action(api.payments.initiatePayment, {
      bookingId,
    } as any);
    return data as {
      payment_attempt_id: string;
      order_id: string;
      amount_minor: number;
      currency: string;
      checkout_data: { payment_session_id: string };
    };
  },

  async getBooking(bookingId: string): Promise<Booking | null> {
    if (!isConvexConfigured) return null;
    const data = await (await authedClient()).query(api.bookings.getBooking, { bookingId } as any);
    if (!data) return null;
    const shaped = snakeize<any>(data);
    return {
      ...shaped.booking,
      event: shaped.event_name
        ? { id: shaped.booking.event_id, name: shaped.event_name, start_at: shaped.event_start_at, end_at: shaped.event_end_at }
        : undefined,
      booking_items: shaped.items?.map((it: any) => ({
        ...it,
        ticket_type: it.ticket_type_id && shaped.ticket_type_names
          ? { name: shaped.ticket_type_names[it.ticket_type_id] }
          : undefined,
      })),
      tickets: shaped.tickets,
    } as unknown as Booking;
  },

  async waitForConfirmation(bookingId: string, timeoutMs = 120_000): Promise<Booking> {
    const terminal = new Set(["CONFIRMED", "FAILED", "EXPIRED", "CANCELLED"]);
    const deadline = Date.now() + timeoutMs;
    let last: Booking | null = null;
    while (Date.now() < deadline) {
      last = await this.getBooking(bookingId);
      if (last && terminal.has(last.status)) return last;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (!last) throw new Error("Could not verify booking status. Check My Tickets after payment completes.");
    return last;
  },
};
