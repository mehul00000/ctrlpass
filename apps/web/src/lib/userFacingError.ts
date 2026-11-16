const TECHNICAL = /postgrest|pgrst|sqlstate|postgres|stack trace|supabase/i;

// Machine-readable codes raised by reserve_booking / confirm_free_booking.
const RPC_CODES: Record<string, string> = {
  UNAUTHENTICATED: 'Please sign in or create an account to reserve and lock tickets.',
  EVENT_NOT_FOUND: 'This event is no longer available.',
  SALES_CLOSED: 'Ticket sales are closed for this event.',
  SALES_NOT_STARTED: 'Ticket sales have not started yet. Check back soon.',
  SALES_ENDED: 'Ticket sales have ended for this event.',
  INVALID_ITEMS: 'Please select at least one ticket tier.',
  INVALID_QUANTITY: 'Please choose a valid ticket quantity.',
  QUANTITY_LIMIT: 'That quantity is not allowed for this tier. Adjust and try again.',
  BOOKING_TICKET_CAP: 'A single booking can hold at most 10 tickets.',
  TICKET_TYPE_NOT_FOUND: 'That ticket tier is no longer available.',
  TICKET_TYPE_UNAVAILABLE: 'That ticket tier is sold out or hidden.',
  SOLD_OUT: 'Not enough passes left in that tier. Try a smaller quantity or another tier.',
  RESERVATION_EXPIRED: 'Your 10-minute hold expired. Please select your tickets again.',
  PAYMENT_REQUIRED: 'This booking requires payment.',
  BOOKING_NOT_CONFIRMABLE: 'This booking can no longer be confirmed. Please start again.',
  FORBIDDEN: 'You are not allowed to perform this action.',
};

export function userFacingError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  if (!raw) return fallback;
  if (RPC_CODES[raw]) return RPC_CODES[raw];
  if (TECHNICAL.test(raw)) return fallback;
  return raw;
}
