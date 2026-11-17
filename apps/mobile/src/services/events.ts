import { api } from '../../../../convex/_generated/api';
import { authedClient, isBackendConfigured, snakeize } from '../lib/convex';
import type { Event, TicketType, RegistrationField } from '../types';

function checkConfigured() {
  if (!isBackendConfigured()) {
    throw new Error(
      'Convex URL required. Please configure EXPO_PUBLIC_CONVEX_URL in apps/mobile/.env.'
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
    let data = (await (await authedClient()).query(api.events.listPublicEvents, {})) as any[];
    data = data.filter(
      (e) => e.status === 'PUBLISHED' || e.status === 'SALES_OPEN',
    );
    if (options?.category) data = data.filter((e) => e.category === options.category);
    if (options?.search) {
      const q = options.search.toLowerCase();
      data = data.filter((e) => e.name?.toLowerCase().includes(q));
    }
    data = data.slice(options?.offset ?? 0, (options?.offset ?? 0) + (options?.limit ?? 20));
    return snakeize<Event[]>(data) as unknown as Event[];
  },

  /** Fetch featured/trending events for home screen */
  async listFeatured(): Promise<Event[]> {
    checkConfigured();
    const data = (await (await authedClient()).query(api.events.listPublicEvents, {})) as any[];
    const filtered = data
      .filter((e) => e.status === 'PUBLISHED' || e.status === 'SALES_OPEN')
      .slice(0, 10);
    return snakeize<Event[]>(filtered) as unknown as Event[];
  },

  /** Fetch single event with all relations */
  async getById(eventId: string): Promise<Event> {
    checkConfigured();
    const data = await (await authedClient()).query(api.events.getPublicEvent, {
      eventId,
    } as any);
    if (!data) throw new Error('Event not found');
    const shaped = snakeize<any>(data);
    return {
      ...shaped.event,
      organizer: shaped.organizer,
      venue: shaped.venue,
      ticket_types: shaped.ticket_types,
    } as unknown as Event;
  },

  /** Fetch ticket types for an event */
  async getTicketTypes(eventId: string): Promise<TicketType[]> {
    checkConfigured();
    const data = await (await authedClient()).query(api.ticketTypes.listForEvent, {
      eventId,
    } as any);
    return (snakeize<TicketType[]>(data) ?? []) as TicketType[];
  },

  /** Alias for getById — used by attendee screens */
  async getEvent(eventId: string): Promise<Event> {
    return eventService.getById(eventId);
  },

  /** Fetch registration fields for an event */
  async getRegistrationFields(eventId: string): Promise<RegistrationField[]> {
    checkConfigured();
    const data = await (await authedClient()).query(api.events.listRegistrationFields, {
      eventId,
    } as any);
    return (snakeize<RegistrationField[]>(data) ?? []) as RegistrationField[];
  },
};
