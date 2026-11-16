import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Booking, Ticket } from '@ctrlpass/types';

export const bookingService = {
  async listOrders(organizerId?: string): Promise<Booking[]> {
    if (!isSupabaseConfigured) return [];
    let query = supabase
      .from('bookings')
      .select('*, event:events(name, id, start_at)')
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as Booking[]) || [];
  },

  async listCheckIns(eventId?: string): Promise<Record<string, unknown>[]> {
    if (!isSupabaseConfigured) return [];
    let query = supabase
      .from('check_ins')
      .select(
        '*, ticket:tickets(*, ticket_type:ticket_types(name)), scanner:profiles!check_ins_scanned_by_fkey(full_name)'
      )
      .order('scanned_at', { ascending: false });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async listTickets(eventId?: string): Promise<Ticket[]> {
    if (!isSupabaseConfigured) return [];
    let query = supabase
      .from('tickets')
      .select('*, ticket_type:ticket_types(name, price_minor), booking:bookings(attendee_name, attendee_email)')
      .order('created_at', { ascending: false });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as Ticket[]) || [];
  },

  async listRefunds(): Promise<any[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('refunds')
      .select('*, booking:bookings(booking_reference, total_amount_minor, attendee_name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Connect database credentials to book passes.');
    }
    const { data, error } = await supabase.rpc('reserve_booking', {
      p_event_id: payload.event_id,
      p_items: payload.items,
      p_attendee: payload.attendee,
    });
    if (error) throw new Error(error.message);
    return data as {
      booking_id: string;
      reservation_id: string;
      booking_reference: string;
      subtotal_minor: number;
      booking_fee_minor: number;
      tax_minor: number;
      total_minor: number;
      expires_at: string;
    };
  },

  async confirmFree(bookingId: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await supabase.rpc('confirm_free_booking', {
      p_booking_id: bookingId,
    });
    if (error) throw new Error(error.message);
    return data as { booking_id: string; status: string };
  },

  async initiatePayment(bookingId: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
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

  async getBooking(bookingId: string): Promise<Booking | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('bookings')
      .select('*, event:events(*, venue:venues(*)), booking_items(*, ticket_type:ticket_types(*))')
      .eq('id', bookingId)
      .single();
    if (error) throw error;
    return data as unknown as Booking;
  },

  async waitForConfirmation(bookingId: string, timeoutMs = 120_000): Promise<Booking> {
    const terminal = new Set(['CONFIRMED', 'FAILED', 'EXPIRED', 'CANCELLED']);
    const deadline = Date.now() + timeoutMs;
    let last: Booking | null = null;
    while (Date.now() < deadline) {
      last = await this.getBooking(bookingId);
      if (last && terminal.has(last.status)) return last;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    if (!last) throw new Error('Could not verify booking status. Check My Tickets after payment completes.');
    return last;
  },
};

