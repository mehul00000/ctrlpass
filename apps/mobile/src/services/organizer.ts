import { supabase } from '../lib/supabase';
import type { Event } from '../types';

// Matches the real check_ins table (the hand-written CheckIn type in types/ does not).
export interface ScanRecord {
  id: string;
  result: 'SUCCESS' | 'DUPLICATE' | 'INVALID' | 'CANCELLED' | 'EXPIRED' | 'WRONG_EVENT';
  scanned_at: string;
  metadata: Record<string, unknown> | null;
}

export const organizerService = {
  /** Fetch events assigned to the current user as volunteer / scanner */
  async volunteerEvents(): Promise<{ event: Event }[]> {
    /*
     * PHASE 3 PENDING — identity mapping: event_members are keyed by the
     * Supabase auth UUID, which a Clerk session cannot produce yet. Return
     * no assignments rather than writing Clerk ids into UUID columns.
     */
    return [];
  },

  /** Volunteer's scan history for one event, newest first. */
  async myScans(eventId: string): Promise<ScanRecord[]> {
    const { data, error } = await supabase
      .from('check_ins')
      .select('id, result, scanned_at, metadata')
      .eq('event_id', eventId)
      .order('scanned_at', { ascending: false })
      .limit(50);
    if (error) return [];
    return (data ?? []) as ScanRecord[];
  },
};
