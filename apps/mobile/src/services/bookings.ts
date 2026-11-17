import { api } from '../../../../convex/_generated/api';
import { authedClient, isBackendConfigured, snakeize } from '../lib/convex';
import { Booking, CheckInResult, ReservationResponse, Ticket } from '../types';

export interface ReservePayload {
  event_id: string;
  items: { ticket_type_id: string; quantity: number }[];
  attendee: {
    name: string;
    email: string;
    phone?: string;
    extra_fields?: Record<string, string>;
  };
}

function checkConfigured() {
  if (!isBackendConfigured()) {
    throw new Error('Convex URL required. Please configure EXPO_PUBLIC_CONVEX_URL.');
  }
}

export const bookingService = {
  async createReservation(payload: ReservePayload): Promise<ReservationResponse> {
    checkConfigured();
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
    return shaped as ReservationResponse;
  },

  async confirmFree(bookingId: string) {
    checkConfigured();
    const result = await (await authedClient()).mutation(api.bookings.confirmFreeBooking, {
      bookingId,
    } as any);
    return { booking_id: (result as any).bookingId, status: (result as any).status };
  },

  async initiatePayment(bookingId: string) {
    checkConfigured();
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

  async getBooking(bookingId: string): Promise<Booking> {
    checkConfigured();
    const data = await (await authedClient()).query(api.bookings.getBooking, {
      bookingId,
    } as any);
    if (!data) throw new Error('Booking not found');
    const shaped = snakeize<any>(data);
    return {
      ...shaped.booking,
      event: shaped.event_name
        ? {
            id: shaped.booking.event_id,
            name: shaped.event_name,
            start_at: shaped.event_start_at,
            end_at: shaped.event_end_at,
          }
        : undefined,
      booking_items: shaped.items,
      tickets: shaped.tickets,
    } as unknown as Booking;
  },

  async waitForConfirmation(bookingId: string, timeoutMs = 120_000): Promise<Booking> {
    const terminal = new Set(['CONFIRMED', 'FAILED', 'EXPIRED', 'CANCELLED']);
    const deadline = Date.now() + timeoutMs;
    let last: Booking | null = null;
    while (Date.now() < deadline) {
      last = await this.getBooking(bookingId);
      if (terminal.has(last.status)) return last;
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 2000));
    }
    if (!last) throw new Error('Could not verify booking status.');
    return last;
  },

  async listMyBookings(): Promise<Booking[]> {
    if (!isBackendConfigured()) return [];
    const data = await (await authedClient()).query(api.bookings.listMyBookings, {});
    return (snakeize<Booking[]>(data) ?? []) as Booking[];
  },

  async listMyTickets(): Promise<Ticket[]> {
    if (!isBackendConfigured()) return [];
    const data = await (await authedClient()).query(api.checkins.listMyTickets, {});
    const shaped = snakeize<any[]>(data) ?? [];
    // Preserve the old embedded ticket_credentials shape for screens.
    return shaped.map((t: any) => ({
      ...t,
      ticket_credentials: { qr_token: t.qr_token ?? t.qrToken ?? null },
    })) as unknown as Ticket[];
  },

  async getTicket(ticketId: string): Promise<Ticket | null> {
    if (!isBackendConfigured()) return null;
    const tickets = (await (await authedClient()).query(api.checkins.listMyTickets, {})) as any[];
    const found = tickets.find((t) => t._id === ticketId);
    if (!found) return null;
    const shaped = snakeize<any>(found);
    return {
      ...shaped,
      ticket_credentials: { qr_token: shaped.qr_token ?? null },
    } as unknown as Ticket;
  },

  async checkIn(qrToken: string, eventId: string): Promise<CheckInResult> {
    checkConfigured();
    const data = await (await authedClient()).mutation(api.checkins.checkinScan, {
      eventId,
      qrToken,
      device: undefined,
    } as any);
    return data as CheckInResult;
  },

  async requestCancellation(bookingId: string, reason?: string) {
    checkConfigured();
    const data = await (await authedClient()).mutation(api.bookings.requestCancellation, {
      bookingId,
      reason,
    } as any);
    return data as { success: boolean; message: string };
  },
};

export function ticketQrToken(ticket: Ticket): string | null {
  const cred = (ticket as any).ticket_credentials;
  if (!cred) return (ticket as any).qr_token ?? null;
  if (Array.isArray(cred)) return cred[0]?.qr_token ?? null;
  return cred.qr_token ?? null;
}
