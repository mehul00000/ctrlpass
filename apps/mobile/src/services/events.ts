import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../config/env';
import type { Event, TicketType, RegistrationField } from '../types';

function checkConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase credentials required. Please configure SUPABASE_URL and SUPABASE_ANON_KEY in src/config/env.ts.'
    );
  }
}

export const eventService = {
  /** Fetch published events for attendee browsing */
  async listPublished(options?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Event[]> {
    checkConfigured();
    let query = supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(id, name, type, verification_status, status),
        venue:venues(*),
        ticket_types(*)
      `)
      .in('status', ['PUBLISHED', 'SALES_OPEN'])
      .eq('visibility', 'PUBLIC')
      .order('start_at', { ascending: true });

    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.search) {
      query = query.ilike('name', `%${options.search}%`);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit ?? 20) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as Event[];
  },

  /** Fetch featured/trending events for home screen */
  async listFeatured(): Promise<Event[]> {
    checkConfigured();
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(id, name, type, verification_status, status),
        venue:venues(*),
        ticket_types(*)
      `)
      .in('status', ['PUBLISHED', 'SALES_OPEN'])
      .eq('visibility', 'PUBLIC')
      .order('start_at', { ascending: true })
      .limit(10);

    if (error) throw error;
    return (data ?? []) as unknown as Event[];
  },

  /** Fetch single event with all relations */
  async getById(eventId: string): Promise<Event> {
    checkConfigured();
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(id, name, type, verification_status, status),
        venue:venues(*),
        ticket_types(*)
      `)
      .eq('id', eventId)
      .single();

    if (error) throw error;
    return data as unknown as Event;
  },

  /** Fetch ticket types for an event */
  async getTicketTypes(eventId: string): Promise<TicketType[]> {
    checkConfigured();
    const { data, error } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'ACTIVE')
      .eq('visibility', 'VISIBLE')
      .order('price_minor', { ascending: true });

    if (error) throw error;
    return (data ?? []) as TicketType[];
  },

  /** Alias for getById — used by attendee screens */
  async getEvent(eventId: string): Promise<Event> {
    return eventService.getById(eventId);
  },

  /** Fetch registration fields for an event */
  async getRegistrationFields(eventId: string): Promise<RegistrationField[]> {
    checkConfigured();
    const { data, error } = await supabase
      .from('registration_fields')
      .select('*')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return (data ?? []) as RegistrationField[];
  },
};
