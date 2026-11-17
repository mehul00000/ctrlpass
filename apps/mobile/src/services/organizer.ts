import { api } from '../../../../convex/_generated/api';
import { authedClient, snakeize } from '../lib/convex';
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
    try {
      const data = (await (await authedClient()).query(api.events.listScannableEvents, {})) as any[];
      return snakeize<any[]>(data).map((event) => ({ event })) as { event: Event }[];
    } catch {
      return [];
    }
  },

  /** Volunteer's scan history for one event, newest first. */
  async myScans(eventId: string): Promise<ScanRecord[]> {
    try {
      const data = (await (await authedClient()).query(api.checkins.listEventCheckIns, {
        eventId,
      } as any)) as any[];
      return (snakeize<ScanRecord[]>(data) ?? []).slice(0, 50) as ScanRecord[];
    } catch {
      return [];
    }
  },
};
