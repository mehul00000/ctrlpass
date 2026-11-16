import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { TicketType } from '@ctrlpass/types';

export type OrganizerRecord = {
  id: string;
  name: string;
  email: string | null;
  city: string | null;
  verification_status: string;
  status: string;
};

function requireConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Connect database credentials to continue.');
  }
}

export const organizerService = {
  async bootstrapMyOrganizer(name: string): Promise<OrganizerRecord> {
    requireConfigured();
    const { data: orgId, error } = await supabase.rpc('bootstrap_my_organizer', {
      p_name: name,
    });
    if (error) throw error;
    const { data, error: fetchError } = await supabase
      .from('organizers')
      .select('id, name, email, city, verification_status, status')
      .eq('id', orgId as string)
      .single();
    if (fetchError) throw fetchError;
    return data as OrganizerRecord;
  },

  async getMyOrganizer(): Promise<OrganizerRecord | null> {
    requireConfigured();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not signed in.');

    const { data: membership, error: memberError } = await supabase
      .from('organizer_members')
      .select('organizer_id')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .limit(1)
      .maybeSingle();
    if (memberError) throw memberError;
    if (!membership) return null;

    const { data, error } = await supabase
      .from('organizers')
      .select('id, name, email, city, verification_status, status')
      .eq('id', membership.organizer_id)
      .single();
    if (error) throw error;
    return data as OrganizerRecord;
  },

  async updateMyOrganizer(
    id: string,
    updates: { name: string; email: string; city: string }
  ): Promise<OrganizerRecord> {
    requireConfigured();
    const { data, error } = await supabase
      .from('organizers')
      .update({ name: updates.name, email: updates.email, city: updates.city, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, email, city, verification_status, status')
      .single();
    if (error) throw error;
    return data as OrganizerRecord;
  },

  async listVolunteers(eventId?: string) {
    requireConfigured();
    let query = supabase
      .from('event_members')
      .select('*, event:events(name)')
      .in('role', ['VOLUNTEER', 'SCANNER'])
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (eventId) query = query.eq('event_id', eventId);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  // ── Volunteer invitations ────────────────────────────────────────────
  // State lives in the volunteer_invitations table (migration 0005).
  // Note: no email provider is wired yet — invitations are recorded and the
  // volunteer activates them by signing in with the invited email.

  async listInvitations(eventId?: string) {
    requireConfigured();
    let query = supabase
      .from('volunteer_invitations')
      .select('*, event:events(name)')
      .order('created_at', { ascending: false });

    if (eventId) query = query.eq('event_id', eventId);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async inviteVolunteer(eventId: string, email: string, role: 'VOLUNTEER' | 'SCANNER' | 'EVENT_MANAGER') {
    requireConfigured();
    const { data, error } = await supabase.rpc('invite_volunteer', {
      p_event_id: eventId,
      p_email: email.trim().toLowerCase(),
      p_role: role,
    });
    if (error) throw error;
    return data;
  },

  async resendInvitation(invitationId: string) {
    requireConfigured();
    const { error } = await supabase.rpc('resend_volunteer_invitation', {
      p_invitation_id: invitationId,
    });
    if (error) throw error;
  },

  async revokeInvitation(invitationId: string) {
    requireConfigured();
    const { error } = await supabase.rpc('revoke_volunteer_invitation', {
      p_invitation_id: invitationId,
    });
    if (error) throw error;
  },

  async upsertVolunteer(
    eventId: string,
    userId: string,
    role: 'VOLUNTEER' | 'SCANNER' = 'SCANNER'
  ) {
    requireConfigured();
    const { data, error } = await supabase
      .from('event_members')
      .upsert(
        { event_id: eventId, user_id: userId, role, status: 'ACTIVE' },
        { onConflict: 'event_id,user_id,role' }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listTicketTypes(eventId: string): Promise<TicketType[]> {
    requireConfigured();
    const { data, error } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data as TicketType[]) ?? [];
  },

  async createTicketType(eventId: string, payload: Partial<TicketType>) {
    requireConfigured();
    const { data, error } = await supabase
      .from('ticket_types')
      .insert([{ ...payload, event_id: eventId }])
      .select()
      .single();
    if (error) throw error;
    return data as TicketType;
  },

  async updateTicketType(id: string, updates: Partial<TicketType>) {
    requireConfigured();
    const { data, error } = await supabase
      .from('ticket_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TicketType;
  },

  async disableTicketType(id: string) {
    return this.updateTicketType(id, { status: 'DISABLED' } as Partial<TicketType>);
  },

  async getFinanceAggregates() {
    requireConfigured();
    const [bookingsRes, paymentsRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('total_amount_minor, booking_fee_minor, status')
        .eq('status', 'CONFIRMED'),
      supabase.from('payments').select('amount_minor, status').eq('status', 'SUCCESS'),
    ]);

    if (bookingsRes.error) throw bookingsRes.error;
    if (paymentsRes.error) throw paymentsRes.error;

    const bookings = bookingsRes.data ?? [];
    const payments = paymentsRes.data ?? [];

    const grossMinor = bookings.reduce((sum, b) => sum + (Number(b.total_amount_minor) || 0), 0);
    const feesMinor = bookings.reduce((sum, b) => sum + (Number(b.booking_fee_minor) || 0), 0);
    const paymentsMinor = payments.reduce((sum, p) => sum + (Number(p.amount_minor) || 0), 0);

    return {
      grossMinor,
      feesMinor,
      netMinor: Math.max(0, grossMinor - feesMinor),
      confirmedBookings: bookings.length,
      successfulPayments: payments.length,
      paymentsMinor,
    };
  },

  async dispatchAnnouncement(eventId: string, title: string, body: string) {
    requireConfigured();
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('status', 'CONFIRMED');

    if (bookingsError) throw bookingsError;

    const userIds = Array.from(new Set<string>((bookings ?? []).map((b) => b.user_id)));
    if (userIds.length === 0) {
      throw new Error('No confirmed attendees to notify for this event.');
    }

    const rows = userIds.map((user_id) => ({
      user_id,
      type: 'EVENT_ANNOUNCEMENT',
      title,
      body,
      data: { event_id: eventId },
    }));

    const { error } = await supabase.from('notifications').insert(rows);
    if (error) throw error;
    return { recipientCount: userIds.length };
  },
};
