// ─── User & Auth ────────────────────────────────────────────
export type UserRole = 'ATTENDEE' | 'VOLUNTEER' | 'ORGANIZER' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DISABLED';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  college: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: string;
  email: string | null;
  status: AccountStatus;
}

export interface UserRoleMembership {
  id: string;
  user_id: string;
  role: UserRole;
  status: string;
  granted_at: string;
}

// ─── Organizer ──────────────────────────────────────────────
export type OrganizerType = 'COLLEGE' | 'EXTERNAL';

export interface Organizer {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  type: OrganizerType;
  created_at: string;
  updated_at: string;
}

export interface OrganizerPublic {
  id: string;
  name: string;
  verification_status: string;
  status: string;
  type: OrganizerType;
}

// ─── Venue ──────────────────────────────────────────────────
export interface Venue {
  id: string;
  name: string;
  address_line: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
}

// ─── Event ──────────────────────────────────────────────────
export type EventStatus =
  | 'DRAFT'
  | 'SUBMITTED_FOR_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'SALES_OPEN'
  | 'SALES_CLOSED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

export type EventFormat = 'PHYSICAL' | 'ONLINE' | 'HYBRID';

export type EventVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

export interface Event {
  id: string;
  organizer_id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  cover_image_url: string | null;
  category: string;
  format: EventFormat;
  status: EventStatus;
  visibility: EventVisibility;
  venue_id: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  doors_open_at: string | null;
  capacity: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  organizer?: OrganizerPublic;
  venue?: Venue | null;
  ticket_types?: TicketType[];
  ticket_tiers?: TicketType[];
}

export type TicketTier = TicketType;

// ─── Ticket Type ────────────────────────────────────────────
export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price_minor: number;
  currency: string;
  quantity?: number;
  capacity?: number;
  reserved_quantity?: number;
  sold_quantity?: number;
  min_per_booking?: number;
  max_per_booking?: number;
  max_per_order?: number;
  sales_start_at?: string | null;
  sales_end_at?: string | null;
  visibility?: 'VISIBLE' | 'HIDDEN';
  status: 'ACTIVE' | 'DISABLED' | string;
}

// ─── Registration ───────────────────────────────────────────
export interface RegistrationField {
  id: string;
  event_id: string;
  label: string;
  field_key: string;
  field_type: string;
  required: boolean;
  display_order: number;
  options: string[] | null;
}

// ─── Booking ────────────────────────────────────────────────
export type BookingStatus =
  | 'CREATED'
  | 'RESERVED'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUND_PENDING'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'
  | 'DISPUTED';

export interface Booking {
  id: string;
  event_id: string;
  user_id: string;
  booking_reference: string;
  status: BookingStatus;
  subtotal_minor: number;
  booking_fee_minor: number;
  tax_minor: number;
  total_amount_minor: number;
  currency: string;
  ticket_count: number;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  extra_fields: Record<string, string> | null;
  expires_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  event?: Partial<Event>;
  booking_items?: BookingItem[];
}

export interface BookingItem {
  id: string;
  booking_id: string;
  ticket_type_id: string;
  quantity: number;
  unit_price_minor: number;
  subtotal_minor: number;
  ticket_type?: TicketType;
}

export interface ReservationResponse {
  booking_id: string;
  reservation_id: string;
  expires_at: string;
  subtotal_minor: number;
  booking_fee_minor: number;
  tax_minor: number;
  total_minor: number;
  currency: string;
  booking_reference: string;
}

// ─── Ticket ─────────────────────────────────────────────────
export type TicketStatus = 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'USED' | 'EXPIRED';

export interface Ticket {
  id: string;
  booking_id: string;
  event_id: string;
  owner_user_id: string;
  ticket_type_id: string;
  ticket_reference: string;
  status: TicketStatus;
  issued_at: string | null;
  checked_in_at: string | null;
  event?: Partial<Event>;
  ticket_type?: TicketType;
  ticket_credentials?: { qr_token: string } | { qr_token: string }[];
}

// ─── Check-in ───────────────────────────────────────────────
export interface CheckInResult {
  success: boolean;
  status:
    | 'VALID'
    | 'INVALID'
    | 'DUPLICATE'
    | 'ALREADY_CHECKED_IN'
    | 'WRONG_EVENT'
    | 'ENTRY_NOT_OPEN'
    | 'ENTRY_CLOSED'
    | 'CANCELLED'
    | 'REFUNDED'
    | 'EXPIRED'
    | 'UNAUTHORIZED';
  ticket_id?: string;
  attendee_name?: string;
  ticket_type?: string;
  event_title?: string;
  checked_in_at?: string;
  message: string;
}

export interface CheckIn {
  id: string;
  ticket_id: string;
  event_id: string;
  scanned_by_user_id: string;
  gate: string | null;
  checked_in_at: string;
}

// ─── Team ───────────────────────────────────────────────────
export interface EventTeamMember {
  id: string;
  event_id: string;
  user_id: string;
  role: 'EVENT_MANAGER' | 'VOLUNTEER' | 'SCANNER';
  status: string;
  assigned_at?: string;
  profile?: Profile;
}

// ─── Notification ───────────────────────────────────────────
export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string> | null;
  read_at: string | null;
  created_at: string;
}

// ─── Payments ───────────────────────────────────────────────
export interface PaymentOrder {
  id: string;
  booking_id: string;
  provider: 'CASHFREE';
  provider_order_id: string;
  amount_minor: number;
  currency: string;
  status: PaymentStatus;
  provider_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Audit ──────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ─── Helpers ────────────────────────────────────────────────
export function remainingInventory(tt: TicketType): number {
  return Math.max(0, (tt.quantity ?? tt.capacity ?? 0) - (tt.reserved_quantity ?? 0) - (tt.sold_quantity ?? 0));
}

export function eventIsFree(event: Event): boolean {
  const types = event.ticket_types ?? [];
  return types.length > 0 && types.every(t => t.price_minor === 0);
}

export function formatMinor(minor: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(minor / 100);
}

// ─── Supabase Database type helper ──────────────────────────
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile };
      events: { Row: Event };
      ticket_types: { Row: TicketType };
      bookings: { Row: Booking };
      booking_items: { Row: BookingItem };
      tickets: { Row: Ticket };
      check_ins: { Row: CheckIn };
      event_team_members: { Row: EventTeamMember };
      notifications: { Row: AppNotification };
      payment_orders: { Row: PaymentOrder };
      audit_logs: { Row: AuditLog };
      venues: { Row: Venue };
      organizers: { Row: Organizer };
      registration_fields: { Row: RegistrationField };
      user_role_memberships: { Row: UserRoleMembership };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
