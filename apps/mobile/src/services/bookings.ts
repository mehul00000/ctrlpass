import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../config/env';
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
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase credentials required. Please configure SUPABASE_URL and SUPABASE_ANON_KEY.'
    );
  }
}

export const bookingService = {
  async createReservation(payload: ReservePayload): Promise<ReservationResponse> {
    checkConfigured();

    const { data, error } = await supabase.rpc('reserve_booking', {
      p_event_id: payload.event_id,
      p_items: payload.items,
      p_attendee: payload.attendee,
    });

    if (error) throw new Error(error.message);
    return data as ReservationResponse;
  },

  async confirmFree(bookingId: string) {
    checkConfigured();

    const { data, error } = await supabase.rpc('confirm_free_booking', {
      p_booking_id: bookingId,
    });

    if (error) throw new Error(error.message);
    return data as { booking_id: string; status: string };
  },

  async initiatePayment(bookingId: string) {
    checkConfigured();

    const { data, error } = await supabase.functions.invoke('initiate-payment', {
      body: { booking_id: bookingId },
    });

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error.message);
    return data.data as {
      payment_attempt_id: string;
      order_id: string;
      amount_minor: number;
      currency: string;
      checkout_data: { payment_session_id: string };
    };
  },

  async getBooking(bookingId: string): Promise<Booking> {
    checkConfigured();

    const { data, error } = await supabase
      .from('bookings')
      .select(
        '*, event:events(id, name, start_at, cover_image_url, venue:venues(name, city)), booking_items(*, ticket_type:ticket_types(name, price_minor))'
      )
      .eq('id', bookingId)
      .single();

    if (error) throw new Error(error.message);
    return data as Booking;
  },

  async waitForConfirmation(bookingId: string, timeoutMs = 120_000): Promise<Booking> {
    const terminal = new Set(['CONFIRMED', 'FAILED', 'EXPIRED', 'CANCELLED']);
    const deadline = Date.now() + timeoutMs;
    let last: Booking | null = null;
    while (Date.now() < deadline) {
      last = await this.getBooking(bookingId);
      if (terminal.has(last.status)) return last;
      await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
    }
    if (!last) throw new Error('Could not verify booking status.');
    return last;
  },

  async listMyBookings(): Promise<Booking[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('bookings')
      .select('*, event:events(id, name, cover_image_url, start_at)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Booking[];
  },

  async listMyTickets(): Promise<Ticket[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('tickets')
      .select(
        '*, event:events(id, name, cover_image_url, start_at, end_at, venue:venues(name, city)), ticket_type:ticket_types(name), ticket_credentials(qr_token)'
      )
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Ticket[];
  },

  async getTicket(ticketId: string): Promise<Ticket | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('tickets')
      .select('*, event:events(*), ticket_type:ticket_types(*), ticket_credentials(qr_token)')
      .eq('id', ticketId)
      .maybeSingle();

    if (error) return null;
    return data as Ticket | null;
  },

  async checkIn(qrToken: string, eventId: string): Promise<CheckInResult> {
    checkConfigured();

    const { data, error } = await supabase.rpc('checkin_scan', {
      p_event_id: eventId,
      p_qr_token: qrToken,
      p_device: null,
    });

    if (error) throw new Error(error.message);
    return data as CheckInResult;
  },

  async requestCancellation(bookingId: string, reason?: string) {
    checkConfigured();

    const { data, error } = await supabase.rpc('request_cancellation', {
      p_booking_id: bookingId,
      p_reason: reason ?? null,
    });

    if (error) throw new Error(error.message);
    return data as { success: boolean; message: string };
  },
};

export function ticketQrToken(ticket: Ticket): string | null {
  const cred = ticket.ticket_credentials;
  if (!cred) return null;
  if (Array.isArray(cred)) return cred[0]?.qr_token ?? null;
  return cred.qr_token ?? null;
}
