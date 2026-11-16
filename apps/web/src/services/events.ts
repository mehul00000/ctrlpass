import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Event, TicketType } from '@ctrlpass/types';

export const eventService = {
  async listPublished(): Promise<Event[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('events')
      .select('*, venue:venues(*), organizer:organizers(*), ticket_types(*)')
      .eq('status', 'PUBLISHED')
      .order('start_at', { ascending: true });

    if (error) throw error;
    return (data as unknown as Event[]) || [];
  },

  async listOrganizerEvents(organizerId?: string): Promise<Event[]> {
    if (!isSupabaseConfigured) return [];
    let query = supabase
      .from('events')
      .select('*, venue:venues(*), ticket_types(*)')
      .order('created_at', { ascending: false });

    if (organizerId) {
      query = query.eq('organizer_id', organizerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as Event[]) || [];
  },

  async listAllEventsForAdmin(): Promise<Event[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('events')
      .select('*, venue:venues(*), organizer:organizers(*), ticket_types(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as Event[]) || [];
  },

  async getById(id: string): Promise<Event | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('events')
      .select('*, venue:venues(*), organizer:organizers(*), ticket_types(*)')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as unknown as Event;
  },

  async createEvent(payload: Partial<Event> & { venue_name?: string; venue_city?: string }): Promise<Event> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Connect database credentials to save events.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be signed in to create an event.');
    }

    let organizerId = payload.organizer_id;

    if (!organizerId) {
      // events_insert RLS requires an ACTIVE organizer_members row; a client-created
      // organizer can never satisfy it (organizer_members_manage is members/admin only).
      const { data: membership } = await supabase
        .from('organizer_members')
        .select('organizer_id')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!membership) {
        throw new Error(
          'No active organizer membership for your account. Ask an existing organizer owner or an admin to add you before creating events.'
        );
      }
      organizerId = membership.organizer_id;
    }

    let venueId = payload.venue_id;
    if (!venueId && (payload.venue_name || payload.venue_city)) {
      const { data: newVenue, error: venueErr } = await supabase
        .from('venues')
        .insert({
          name: payload.venue_name || 'Main Event Grounds',
          city: payload.venue_city || 'Bengaluru',
        })
        .select('id')
        .single();
      if (!venueErr && newVenue) {
        venueId = newVenue.id;
      }
    }

    const { venue_name, venue_city, ...eventFields } = payload;

    const eventRecord = {
      ...eventFields,
      organizer_id: organizerId,
      created_by: user.id,
      venue_id: venueId,
      format: payload.format || 'PHYSICAL',
      short_description: payload.short_description || (payload.description ? payload.description.slice(0, 140) : payload.name || ''),
      status: payload.status || 'DRAFT',
    };

    const { data, error } = await supabase
      .from('events')
      .insert([eventRecord])
      .select('*, venue:venues(*), organizer:organizers(*)')
      .single();

    if (error) throw error;
    return data as unknown as Event;
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Event;
  },

  async updateEventStatus(id: string, status: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { error } = await supabase
      .from('events')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  // Lifecycle transitions go through the DB RPCs — they enforce status, role and audit.
  // Raw updateEventStatus remains only for CANCELLED, which has no RPC.
  async transitionEvent(id: string, action: 'submit' | 'publish' | 'open_sales' | 'close_sales'): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const rpcName = {
      submit: 'submit_event',
      publish: 'publish_event',
      open_sales: 'open_sales',
      close_sales: 'close_sales',
    }[action];
    const { error } = await supabase.rpc(rpcName, { p_event_id: id });
    if (error) throw error;
  },

  async adminReviewEvent(id: string, approve: boolean, reason?: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { error } = await supabase.rpc('admin_review_event', {
      p_event_id: id,
      p_approve: approve,
      p_reason: reason ?? null,
    });
    if (error) throw error;
  },
};
