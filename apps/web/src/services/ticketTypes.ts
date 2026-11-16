import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { TicketType } from '@ctrlpass/types';

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
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await supabase
      .from('ticket_types')
      .insert({
        ...payload,
        status: payload.status || 'ACTIVE',
        visibility: payload.visibility || 'VISIBLE',
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as TicketType;
  },

  async listByEvent(eventId: string): Promise<TicketType[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', eventId)
      .order('price_minor', { ascending: true });

    if (error) throw error;
    return (data ?? []) as unknown as TicketType[];
  },

  async remove(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('ticket_types').delete().eq('id', id);
    if (error) throw error;
  },
};
