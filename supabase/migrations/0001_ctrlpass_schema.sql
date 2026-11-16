-- CtrlPass schema + RLS + authoritative RPCs (DATABASE_SCHEMA / SECURITY_AND_RLS).
-- Money: amount_minor BIGINT (paise). Currency: INR.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function booking_fee_minor(ticket_count int, is_paid boolean)
returns bigint language plpgsql immutable as $$
begin
  if not is_paid or ticket_count <= 0 then
    return 0;
  end if;
  return least(3000 + 500 * (ticket_count - 1), 6000);
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create table public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  email_verified_at timestamptz,
  status text not null default 'PENDING' check (status in ('ACTIVE','PENDING','SUSPENDED','DISABLED')),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  city text,
  state text,
  profile_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('ATTENDEE','VOLUNTEER','ORGANIZER','ADMIN')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','REVOKED')),
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  revoked_by uuid references auth.users(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- ---------------------------------------------------------------------------
-- Organizer
-- ---------------------------------------------------------------------------
create table public.organizers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('COLLEGE','EXTERNAL')),
  description text,
  email text,
  phone text,
  website text,
  city text,
  state text,
  address text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPENDED','DISABLED')),
  verification_status text not null default 'PENDING' check (verification_status in ('PENDING','VERIFIED','REJECTED')),
  created_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizer_members (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_role text not null check (membership_role in ('OWNER','MANAGER','FINANCE','EVENT_MANAGER')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INVITED','REVOKED')),
  invited_by uuid references auth.users(id),
  joined_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organizer_id, user_id)
);

create table public.organizer_verifications (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers(id) on delete cascade,
  submitted_by uuid not null references auth.users(id),
  status text not null default 'PENDING' check (status in ('PENDING','UNDER_REVIEW','APPROVED','REJECTED','MORE_INFORMATION_REQUIRED')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizer_documents (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers(id) on delete cascade,
  verification_id uuid references public.organizer_verifications(id),
  document_type text not null,
  storage_path text not null,
  status text not null default 'PENDING',
  uploaded_by uuid not null references auth.users(id),
  uploaded_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address_line text,
  city text,
  state text,
  pincode text,
  latitude numeric,
  longitude numeric,
  maps_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers(id),
  name text not null,
  short_description text not null default '',
  description text not null default '',
  category text not null default 'OTHER',
  cover_image_url text,
  format text not null check (format in ('PHYSICAL','ONLINE','HYBRID')),
  status text not null default 'DRAFT' check (status in (
    'DRAFT','SUBMITTED_FOR_REVIEW','APPROVED','PUBLISHED','SALES_OPEN','SALES_CLOSED','ONGOING','COMPLETED','CANCELLED'
  )),
  visibility text not null default 'PUBLIC' check (visibility in ('PUBLIC','PRIVATE','UNLISTED')),
  venue_id uuid references public.venues(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'Asia/Kolkata',
  doors_open_at timestamptz,
  capacity int,
  created_by uuid not null references auth.users(id),
  submitted_at timestamptz,
  approved_at timestamptz,
  published_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  original_start_at timestamptz,
  original_end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table public.event_online_details (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  platform text,
  access_url text,
  access_instructions text,
  password_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('EVENT_MANAGER','VOLUNTEER','SCANNER')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INVITED','REVOKED')),
  invited_by uuid references auth.users(id),
  joined_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id, role)
);

create table public.refund_policies (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  policy_type text not null default 'STANDARD',
  refund_deadline timestamptz,
  organizer_cancel_refund boolean not null default true,
  attendee_cancel_allowed boolean not null default false,
  booking_fee_refundable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text,
  price_minor bigint not null default 0 check (price_minor >= 0),
  currency char(3) not null default 'INR',
  quantity int not null check (quantity >= 0),
  reserved_quantity int not null default 0 check (reserved_quantity >= 0),
  sold_quantity int not null default 0 check (sold_quantity >= 0),
  min_per_booking int not null default 1 check (min_per_booking >= 1),
  max_per_booking int not null default 10 check (max_per_booking >= 1),
  sales_start_at timestamptz,
  sales_end_at timestamptz,
  visibility text not null default 'VISIBLE' check (visibility in ('VISIBLE','HIDDEN')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','DISABLED')),
  refund_policy_id uuid references public.refund_policies(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reserved_quantity + sold_quantity <= quantity)
);

create table public.registration_fields (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null,
  field_key text not null,
  field_type text not null check (field_type in ('TEXT','EMAIL','PHONE','NUMBER','DATE','SELECT','MULTI_SELECT','CHECKBOX')),
  required boolean not null default false,
  display_order int not null default 0,
  options jsonb,
  validation_rules jsonb,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, field_key)
);

-- ---------------------------------------------------------------------------
-- Bookings / payments / tickets
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  event_id uuid not null references public.events(id),
  booking_reference text not null unique,
  status text not null check (status in (
    'CREATED','RESERVED','PAYMENT_PENDING','CONFIRMED','CANCELLED','EXPIRED','FAILED','REFUND_PENDING','REFUNDED','PARTIALLY_REFUNDED'
  )),
  subtotal_minor bigint not null,
  booking_fee_minor bigint not null,
  discount_minor bigint not null default 0,
  tax_minor bigint not null default 0,
  total_amount_minor bigint not null,
  currency char(3) not null default 'INR',
  ticket_count int not null,
  attendee_name text not null,
  attendee_email text not null,
  attendee_phone text,
  extra_fields jsonb,
  expires_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  status text not null check (status in ('ACTIVE','EXPIRED','RELEASED','CONSUMED')),
  expires_at timestamptz not null,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings add column reservation_id uuid references public.reservations(id);

create table public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types(id),
  quantity int not null check (quantity > 0),
  unit_price_minor bigint not null,
  subtotal_minor bigint not null,
  refunded_quantity int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.registration_answers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  field_id uuid not null references public.registration_fields(id),
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  provider text not null default 'CASHFREE',
  provider_order_id text,
  provider_payment_id text,
  attempt_number int not null,
  amount_minor bigint not null,
  currency char(3) not null default 'INR',
  status text not null check (status in ('INITIATED','PENDING','AUTHORIZED','CAPTURED','FAILED')),
  idempotency_key text not null unique,
  initiated_at timestamptz not null default now(),
  completed_at timestamptz,
  failure_code text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  payment_attempt_id uuid references public.payment_attempts(id),
  provider text not null default 'CASHFREE',
  provider_payment_id text,
  provider_order_id text,
  amount_minor bigint not null,
  currency char(3) not null default 'INR',
  status text not null check (status in (
    'INITIATED','PENDING','AUTHORIZED','CAPTURED','FAILED','REFUND_PENDING','PARTIALLY_REFUNDED','REFUNDED','DISPUTED'
  )),
  captured_at timestamptz,
  failed_at timestamptz,
  disputed_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_webhooks (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'CASHFREE',
  provider_event_id text,
  event_type text,
  payload jsonb not null,
  signature text,
  signature_verified boolean not null default false,
  processing_status text not null default 'RECEIVED' check (processing_status in (
    'RECEIVED','SIGNATURE_VERIFIED','PROCESSING','PROCESSED','PROCESSING_FAILED'
  )),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  booking_item_id uuid not null references public.booking_items(id),
  ticket_type_id uuid not null references public.ticket_types(id),
  event_id uuid not null references public.events(id),
  owner_user_id uuid not null references auth.users(id),
  ticket_reference text not null unique,
  qr_token_hash text not null unique,
  status text not null check (status in ('PENDING','ACTIVE','CANCELLED','USED','EXPIRED')),
  issued_at timestamptz,
  cancelled_at timestamptz,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Owner-only display store. Lookup/validation uses tickets.qr_token_hash.
create table public.ticket_credentials (
  ticket_id uuid primary key references public.tickets(id) on delete cascade,
  qr_token text not null,
  created_at timestamptz not null default now()
);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id),
  event_id uuid not null references public.events(id),
  scanned_by uuid not null references auth.users(id),
  result text not null check (result in ('SUCCESS','DUPLICATE','INVALID','CANCELLED','EXPIRED','WRONG_EVENT')),
  scanned_at timestamptz not null default now(),
  device_reference text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  payment_id uuid references public.payments(id),
  status text not null check (status in ('REQUESTED','PENDING','PROCESSING','SUCCESS','FAILED','REJECTED')),
  amount_minor bigint not null,
  currency char(3) not null default 'INR',
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid,
  event_id uuid,
  booking_id uuid,
  payment_id uuid,
  refund_id uuid,
  settlement_id uuid,
  entry_type text not null,
  direction text not null check (direction in ('DEBIT','CREDIT')),
  amount_minor bigint not null,
  currency char(3) not null default 'INR',
  reference_type text,
  reference_id uuid,
  description text,
  created_at timestamptz not null default now(),
  metadata jsonb
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers(id),
  event_id uuid references public.events(id),
  status text not null default 'PENDING' check (status in ('PENDING','ELIGIBLE','ON_HOLD','PROCESSING','COMPLETED','FAILED','REVERSED')),
  gross_amount_minor bigint not null default 0,
  refunds_minor bigint not null default 0,
  commission_minor bigint not null default 0,
  gateway_fees_minor bigint not null default 0,
  adjustments_minor bigint not null default 0,
  net_amount_minor bigint not null default 0,
  provider text default 'CASHFREE',
  provider_settlement_id text,
  settlement_reference text,
  eligible_at timestamptz,
  initiated_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb,
  read_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel text not null check (channel in ('IN_APP','EMAIL','PUSH','SMS')),
  provider text,
  provider_reference text,
  status text not null default 'PENDING',
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_role text,
  action text not null,
  resource_type text,
  resource_id uuid,
  event_id uuid,
  organizer_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_reference text,
  user_agent_reference text,
  created_at timestamptz not null default now(),
  metadata jsonb
);

create index events_status_start_idx on public.events (status, start_at);
create index events_organizer_idx on public.events (organizer_id);
create index bookings_user_idx on public.bookings (user_id, created_at desc);
create index tickets_owner_idx on public.tickets (owner_user_id);
create index tickets_event_idx on public.tickets (event_id);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index check_ins_event_idx on public.check_ins (event_id, scanned_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'app_users','profiles','organizers','organizer_members','events','ticket_types',
    'bookings','reservations','payments','payment_attempts','tickets','refunds','settlements'
  ]
  loop
    execute format(
      'create trigger %I_updated_at before update on public.%I for each row execute function set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Auth bootstrap: profile + ATTENDEE. Roles are never client-assignable.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.app_users (id, email, status)
  values (new.id, new.email, case when new.email_confirmed_at is not null then 'ACTIVE' else 'PENDING' end);
  insert into public.profiles (id, user_id) values (new.id, new.id);
  insert into public.user_roles (user_id, role, status) values (new.id, 'ATTENDEE', 'ACTIVE');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Auth helpers (RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'ADMIN' and status = 'ACTIVE'
  );
$$;

create or replace function public.has_active_role(p_role text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = p_role and status = 'ACTIVE'
  );
$$;

create or replace function public.is_organizer_member(p_organizer_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organizer_members
    where organizer_id = p_organizer_id and user_id = auth.uid() and status = 'ACTIVE'
  );
$$;

create or replace function public.can_manage_event(p_event_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and (
        public.is_admin()
        or public.is_organizer_member(e.organizer_id)
        or exists (
          select 1 from public.event_members m
          where m.event_id = p_event_id and m.user_id = auth.uid()
            and m.role = 'EVENT_MANAGER' and m.status = 'ACTIVE'
        )
      )
  );
$$;

create or replace function public.can_scan_event(p_event_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_manage_event(p_event_id) or exists (
    select 1 from public.event_members m
    where m.event_id = p_event_id and m.user_id = auth.uid()
      and m.role in ('VOLUNTEER','SCANNER') and m.status = 'ACTIVE'
  );
$$;

create or replace function public.event_is_publicly_listed(p_status text, p_visibility text)
returns boolean language sql immutable as $$
  select p_visibility = 'PUBLIC' and p_status in ('PUBLISHED','SALES_OPEN','SALES_CLOSED','ONGOING','COMPLETED');
$$;

-- ---------------------------------------------------------------------------
-- Inventory / booking
-- ---------------------------------------------------------------------------
create or replace function public.release_expired_reservations()
returns int language plpgsql security definer set search_path = public as $$
declare n int := 0;
declare r record;
begin
  for r in
    select res.id, res.booking_id
    from public.reservations res
    where res.status = 'ACTIVE' and res.expires_at < now()
    for update skip locked
  loop
    perform public._release_reservation(r.booking_id, 'EXPIRED');
    n := n + 1;
  end loop;
  return n;
end;
$$;

create or replace function public._release_reservation(p_booking_id uuid, p_booking_status text)
returns void language plpgsql security definer set search_path = public as $$
declare item record;
begin
  update public.reservations
    set status = case when p_booking_status = 'EXPIRED' then 'EXPIRED' else 'RELEASED' end,
        released_at = now()
    where booking_id = p_booking_id and status = 'ACTIVE';

  for item in select ticket_type_id, quantity from public.booking_items where booking_id = p_booking_id
  loop
    update public.ticket_types
      set reserved_quantity = reserved_quantity - item.quantity
      where id = item.ticket_type_id and reserved_quantity >= item.quantity;
  end loop;

  update public.bookings
    set status = p_booking_status
    where id = p_booking_id and status in ('RESERVED','PAYMENT_PENDING','CREATED');
end;
$$;

create or replace function public._notify(
  p_user uuid, p_type text, p_title text, p_body text, p_data jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path = public as $$
declare nid uuid;
begin
  insert into public.notifications (user_id, type, title, body, data, delivered_at)
  values (p_user, p_type, p_title, p_body, p_data, now())
  returning id into nid;
  insert into public.notification_deliveries (notification_id, channel, status, delivered_at)
  values (nid, 'IN_APP', 'DELIVERED', now());
end;
$$;

create or replace function public._issue_tickets(p_booking_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare item record;
declare i int;
declare tid uuid;
declare token text;
declare href text;
declare b public.bookings%rowtype;
begin
  select * into b from public.bookings where id = p_booking_id;
  for item in select * from public.booking_items where booking_id = p_booking_id
  loop
    for i in 1..item.quantity loop
      tid := gen_random_uuid();
      token := encode(gen_random_bytes(24), 'hex');
      href := 'CP-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(tid::text, '-', ''), 1, 6));
      insert into public.tickets (
        id, booking_id, booking_item_id, ticket_type_id, event_id, owner_user_id,
        ticket_reference, qr_token_hash, status, issued_at
      ) values (
        tid, p_booking_id, item.id, item.ticket_type_id, b.event_id, b.user_id,
        href, encode(digest(token, 'sha256'), 'hex'), 'ACTIVE', now()
      );
      insert into public.ticket_credentials (ticket_id, qr_token) values (tid, 'CP:' || token);
    end loop;
    update public.ticket_types
      set reserved_quantity = reserved_quantity - item.quantity,
          sold_quantity = sold_quantity + item.quantity
      where id = item.ticket_type_id;
  end loop;
end;
$$;

create or replace function public._confirm_booking(p_booking_id uuid, p_payment_id uuid default null)
returns public.bookings language plpgsql security definer set search_path = public as $$
declare b public.bookings%rowtype;
declare ev public.events%rowtype;
begin
  select * into b from public.bookings where id = p_booking_id for update;
  if b.status = 'CONFIRMED' then
    return b;
  end if;
  if b.status not in ('RESERVED','PAYMENT_PENDING') then
    raise exception 'BOOKING_NOT_CONFIRMABLE';
  end if;

  select * into ev from public.events where id = b.event_id;
  update public.reservations set status = 'CONSUMED' where booking_id = p_booking_id and status = 'ACTIVE';
  perform public._issue_tickets(p_booking_id);
  update public.bookings set status = 'CONFIRMED', confirmed_at = now() where id = p_booking_id
    returning * into b;

  insert into public.ledger_entries (organizer_id, event_id, booking_id, payment_id, entry_type, direction, amount_minor, reference_type, reference_id, description)
  values (ev.organizer_id, b.event_id, b.id, p_payment_id, 'TICKET_REVENUE', 'CREDIT', b.subtotal_minor, 'booking', b.id, 'Ticket subtotal');
  if b.booking_fee_minor > 0 then
    insert into public.ledger_entries (organizer_id, event_id, booking_id, payment_id, entry_type, direction, amount_minor, reference_type, reference_id, description)
    values (ev.organizer_id, b.event_id, b.id, p_payment_id, 'BOOKING_FEE', 'CREDIT', b.booking_fee_minor, 'booking', b.id, 'CtrlPass booking fee');
  end if;

  perform public._notify(b.user_id, 'BOOKING_CONFIRMED', 'Booking confirmed',
    'Your booking ' || b.booking_reference || ' is confirmed.',
    jsonb_build_object('booking_id', b.id, 'event_id', b.event_id));
  perform public._notify(b.user_id, 'TICKET_ISSUED', 'Tickets issued',
    'Your CtrlPass tickets are ready.',
    jsonb_build_object('booking_id', b.id));
  return b;
end;
$$;

create or replace function public.reserve_booking(p_event_id uuid, p_items jsonb, p_attendee jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
declare ev public.events%rowtype;
declare item jsonb;
declare tt public.ticket_types%rowtype;
declare qty int;
declare ticket_total int := 0;
declare subtotal bigint := 0;
declare fee bigint;
declare paid boolean := false;
declare bid uuid;
declare rid uuid;
declare ref text;
declare expires timestamptz;
begin
  if uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;
  perform public.release_expired_reservations();

  select * into ev from public.events where id = p_event_id for share;
  if ev.id is null then raise exception 'EVENT_NOT_FOUND'; end if;
  if ev.status not in ('SALES_OPEN','PUBLISHED') then raise exception 'SALES_CLOSED'; end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'INVALID_ITEMS';
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    qty := (item->>'quantity')::int;
    if qty is null or qty < 1 then raise exception 'INVALID_QUANTITY'; end if;
    ticket_total := ticket_total + qty;
    select * into tt from public.ticket_types where id = (item->>'ticket_type_id')::uuid and event_id = p_event_id for update;
    if tt.id is null then raise exception 'TICKET_TYPE_NOT_FOUND'; end if;
    if tt.status <> 'ACTIVE' or tt.visibility <> 'VISIBLE' then raise exception 'TICKET_TYPE_UNAVAILABLE'; end if;
    if tt.sales_start_at is not null and now() < tt.sales_start_at then raise exception 'SALES_NOT_STARTED'; end if;
    if tt.sales_end_at is not null and now() > tt.sales_end_at then raise exception 'SALES_ENDED'; end if;
    if qty < tt.min_per_booking or qty > tt.max_per_booking then raise exception 'QUANTITY_LIMIT'; end if;
    if (tt.quantity - tt.reserved_quantity - tt.sold_quantity) < qty then raise exception 'SOLD_OUT'; end if;
    if tt.price_minor > 0 then paid := true; end if;
    subtotal := subtotal + tt.price_minor * qty;
  end loop;

  if ticket_total > 10 then raise exception 'BOOKING_TICKET_CAP'; end if;
  fee := public.booking_fee_minor(ticket_total, paid);

  bid := gen_random_uuid();
  ref := 'BKG-' || upper(substr(replace(bid::text, '-', ''), 1, 10));
  expires := now() + interval '10 minutes';

  insert into public.bookings (
    id, user_id, event_id, booking_reference, status,
    subtotal_minor, booking_fee_minor, total_amount_minor, ticket_count,
    attendee_name, attendee_email, attendee_phone, extra_fields, expires_at
  ) values (
    bid, uid, p_event_id, ref, 'RESERVED',
    subtotal, fee, subtotal + fee, ticket_total,
    coalesce(p_attendee->>'name',''), coalesce(p_attendee->>'email',''), p_attendee->>'phone',
    p_attendee->'extra_fields', expires
  );

  insert into public.reservations (booking_id, status, expires_at)
  values (bid, 'ACTIVE', expires)
  returning id into rid;
  update public.bookings set reservation_id = rid where id = bid;

  for item in select * from jsonb_array_elements(p_items)
  loop
    qty := (item->>'quantity')::int;
    select * into tt from public.ticket_types where id = (item->>'ticket_type_id')::uuid;
    insert into public.booking_items (booking_id, ticket_type_id, quantity, unit_price_minor, subtotal_minor)
    values (bid, tt.id, qty, tt.price_minor, tt.price_minor * qty);
    update public.ticket_types set reserved_quantity = reserved_quantity + qty where id = tt.id;
  end loop;

  insert into public.audit_logs (actor_user_id, action, resource_type, resource_id, event_id)
  values (uid, 'BOOKING_RESERVED', 'booking', bid, p_event_id);

  return jsonb_build_object(
    'booking_id', bid,
    'reservation_id', rid,
    'expires_at', expires,
    'subtotal_minor', subtotal,
    'booking_fee_minor', fee,
    'tax_minor', 0,
    'total_minor', subtotal + fee,
    'currency', 'INR',
    'booking_reference', ref
  );
end;
$$;

create or replace function public.confirm_free_booking(p_booking_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b public.bookings%rowtype;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into b from public.bookings where id = p_booking_id for update;
  if b.user_id <> auth.uid() and not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if b.total_amount_minor <> 0 then raise exception 'PAYMENT_REQUIRED'; end if;
  if b.expires_at is not null and b.expires_at < now() then
    perform public._release_reservation(b.id, 'EXPIRED');
    raise exception 'RESERVATION_EXPIRED';
  end if;
  b := public._confirm_booking(b.id, null);
  return jsonb_build_object('booking_id', b.id, 'status', b.status);
end;
$$;

create or replace function public.apply_captured_payment(
  p_booking_id uuid,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_amount_minor bigint,
  p_attempt_id uuid
) returns jsonb language plpgsql security definer set search_path = public as $$
declare b public.bookings%rowtype;
declare pay public.payments%rowtype;
begin
  select * into b from public.bookings where id = p_booking_id for update;
  if b.id is null then raise exception 'BOOKING_NOT_FOUND'; end if;
  if b.total_amount_minor <> p_amount_minor then raise exception 'AMOUNT_MISMATCH'; end if;

  if b.status = 'CONFIRMED' then
    return jsonb_build_object('booking_id', b.id, 'status', b.status, 'idempotent', true);
  end if;

  if b.expires_at is not null and b.expires_at < now() and b.status <> 'CONFIRMED' then
    -- Late successful payment: do not silently drop. Confirm if inventory still held or already consumed path.
    -- Inventory is still reserved until expiry release; if already released, mark REQUIRES_RECONCILIATION.
    if not exists (select 1 from public.reservations where booking_id = b.id and status = 'ACTIVE') then
      insert into public.payments (booking_id, payment_attempt_id, provider_order_id, provider_payment_id, amount_minor, status, metadata)
      values (b.id, p_attempt_id, p_provider_order_id, p_provider_payment_id, p_amount_minor, 'CAPTURED',
        jsonb_build_object('reconciliation', 'LATE_SUCCESS_AFTER_EXPIRY'));
      update public.bookings set status = 'FAILED' where id = b.id;
      return jsonb_build_object('booking_id', b.id, 'status', 'REQUIRES_RECONCILIATION');
    end if;
  end if;

  insert into public.payments (booking_id, payment_attempt_id, provider, provider_order_id, provider_payment_id, amount_minor, status, captured_at)
  values (b.id, p_attempt_id, 'CASHFREE', p_provider_order_id, p_provider_payment_id, p_amount_minor, 'CAPTURED', now())
  returning * into pay;

  update public.payment_attempts
    set status = 'CAPTURED', provider_payment_id = p_provider_payment_id, completed_at = now()
    where id = p_attempt_id;

  b := public._confirm_booking(b.id, pay.id);
  perform public._notify(b.user_id, 'PAYMENT_SUCCESS', 'Payment received',
    'Payment for booking ' || b.booking_reference || ' was successful.',
    jsonb_build_object('booking_id', b.id));
  return jsonb_build_object('booking_id', b.id, 'status', b.status, 'payment_id', pay.id);
end;
$$;

create or replace function public.checkin_scan(p_event_id uuid, p_qr_token text, p_device text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
declare token text;
declare hash text;
declare t public.tickets%rowtype;
declare tt public.ticket_types%rowtype;
declare ev public.events%rowtype;
declare pname text;
declare result text;
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.can_scan_event(p_event_id) then
    insert into public.check_ins (event_id, scanned_by, result, device_reference)
    values (p_event_id, uid, 'INVALID', p_device);
    return jsonb_build_object('success', false, 'status', 'UNAUTHORIZED', 'message', 'Not authorized to scan this event.');
  end if;

  token := p_qr_token;
  if token like 'ctrlpass://ticket/%' then
    token := substr(token, length('ctrlpass://ticket/') + 1);
  elsif token like 'CP:%' then
    token := substr(token, 4);
  end if;
  hash := encode(digest(token, 'sha256'), 'hex');

  select * into t from public.tickets where qr_token_hash = hash for update;
  if t.id is null then
    insert into public.check_ins (event_id, scanned_by, result, device_reference)
    values (p_event_id, uid, 'INVALID', p_device);
    return jsonb_build_object('success', false, 'status', 'INVALID', 'message', 'Ticket not recognized.');
  end if;

  if t.event_id <> p_event_id then
    insert into public.check_ins (ticket_id, event_id, scanned_by, result, device_reference)
    values (t.id, p_event_id, uid, 'WRONG_EVENT', p_device);
    return jsonb_build_object('success', false, 'status', 'INVALID', 'message', 'Wrong event.');
  end if;

  if t.status = 'USED' then
    insert into public.check_ins (ticket_id, event_id, scanned_by, result, device_reference)
    values (t.id, p_event_id, uid, 'DUPLICATE', p_device);
    return jsonb_build_object('success', false, 'status', 'ALREADY_CHECKED_IN', 'ticket_id', t.id,
      'checked_in_at', t.checked_in_at, 'message', 'Already checked in.');
  end if;
  if t.status = 'CANCELLED' then
    insert into public.check_ins (ticket_id, event_id, scanned_by, result, device_reference)
    values (t.id, p_event_id, uid, 'CANCELLED', p_device);
    return jsonb_build_object('success', false, 'status', 'CANCELLED', 'message', 'Ticket cancelled.');
  end if;
  if t.status = 'EXPIRED' then
    insert into public.check_ins (ticket_id, event_id, scanned_by, result, device_reference)
    values (t.id, p_event_id, uid, 'EXPIRED', p_device);
    return jsonb_build_object('success', false, 'status', 'EXPIRED', 'message', 'Ticket expired.');
  end if;
  if t.status <> 'ACTIVE' then
    insert into public.check_ins (ticket_id, event_id, scanned_by, result, device_reference)
    values (t.id, p_event_id, uid, 'INVALID', p_device);
    return jsonb_build_object('success', false, 'status', 'INVALID', 'message', 'Ticket not valid for entry.');
  end if;

  update public.tickets set status = 'USED', checked_in_at = now() where id = t.id and status = 'ACTIVE'
    returning * into t;
  if t.status <> 'USED' then
    return jsonb_build_object('success', false, 'status', 'ALREADY_CHECKED_IN', 'message', 'Already checked in.');
  end if;

  insert into public.check_ins (ticket_id, event_id, scanned_by, result, device_reference)
  values (t.id, p_event_id, uid, 'SUCCESS', p_device);

  select * into tt from public.ticket_types where id = t.ticket_type_id;
  select * into ev from public.events where id = t.event_id;
  select attendee_name into pname from public.bookings where id = t.booking_id;

  return jsonb_build_object(
    'success', true,
    'status', 'VALID',
    'ticket_id', t.id,
    'attendee_name', pname,
    'ticket_type', tt.name,
    'event_title', ev.name,
    'checked_in_at', t.checked_in_at,
    'message', 'Check-in successful.'
  );
end;
$$;

create or replace function public.request_cancellation(p_booking_id uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b public.bookings%rowtype;
declare pol public.refund_policies%rowtype;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into b from public.bookings where id = p_booking_id for update;
  if b.user_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if b.status <> 'CONFIRMED' then raise exception 'NOT_CANCELLABLE'; end if;
  select * into pol from public.refund_policies where event_id = b.event_id limit 1;
  if pol.id is null or pol.attendee_cancel_allowed is not true then
    return jsonb_build_object('success', false, 'message', 'Cancellation is not allowed for this event.');
  end if;
  if pol.refund_deadline is not null and now() > pol.refund_deadline then
    return jsonb_build_object('success', false, 'message', 'The cancellation window has closed.');
  end if;
  update public.bookings set status = 'CANCELLED', cancelled_at = now() where id = b.id;
  update public.tickets set status = 'CANCELLED', cancelled_at = now()
    where booking_id = b.id and status in ('ACTIVE','PENDING');
  insert into public.refunds (booking_id, status, amount_minor, reason)
  values (b.id, 'REQUESTED', b.total_amount_minor, p_reason);
  perform public._notify(b.user_id, 'REFUND_INITIATED', 'Cancellation requested',
    'Your cancellation request is being processed.', jsonb_build_object('booking_id', b.id));
  return jsonb_build_object('success', true, 'message', 'Cancellation requested. Refunds are processed by the backend.');
end;
$$;

create or replace function public.submit_event(p_event_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ev public.events%rowtype;
begin
  if not public.can_manage_event(p_event_id) then raise exception 'FORBIDDEN'; end if;
  select * into ev from public.events where id = p_event_id for update;
  if ev.status <> 'DRAFT' then raise exception 'INVALID_TRANSITION'; end if;
  update public.events set status = 'SUBMITTED_FOR_REVIEW', submitted_at = now() where id = p_event_id;
  insert into public.audit_logs (actor_user_id, action, resource_type, resource_id, event_id, organizer_id)
  values (auth.uid(), 'EVENT_SUBMITTED', 'event', p_event_id, p_event_id, ev.organizer_id);
  return jsonb_build_object('status', 'SUBMITTED_FOR_REVIEW');
end;
$$;

create or replace function public.admin_review_event(p_event_id uuid, p_approve boolean, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ev public.events%rowtype;
declare st text;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into ev from public.events where id = p_event_id for update;
  if ev.status <> 'SUBMITTED_FOR_REVIEW' then raise exception 'INVALID_TRANSITION'; end if;
  if p_approve then
    st := 'APPROVED';
    update public.events set status = st, approved_at = now() where id = p_event_id;
  else
    st := 'DRAFT';
    update public.events set status = st where id = p_event_id;
  end if;
  insert into public.audit_logs (actor_user_id, actor_role, action, resource_type, resource_id, event_id, metadata)
  values (auth.uid(), 'ADMIN', case when p_approve then 'EVENT_APPROVED' else 'EVENT_REJECTED' end,
    'event', p_event_id, p_event_id, jsonb_build_object('reason', p_reason));
  return jsonb_build_object('status', st);
end;
$$;

create or replace function public.publish_event(p_event_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ev public.events%rowtype;
begin
  if not public.can_manage_event(p_event_id) then raise exception 'FORBIDDEN'; end if;
  select * into ev from public.events where id = p_event_id for update;
  if ev.status <> 'APPROVED' then raise exception 'INVALID_TRANSITION'; end if;
  update public.events set status = 'PUBLISHED', published_at = now() where id = p_event_id;
  return jsonb_build_object('status', 'PUBLISHED');
end;
$$;

create or replace function public.open_sales(p_event_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_event(p_event_id) then raise exception 'FORBIDDEN'; end if;
  update public.events set status = 'SALES_OPEN' where id = p_event_id and status in ('PUBLISHED','SALES_CLOSED');
  if not found then raise exception 'INVALID_TRANSITION'; end if;
  return jsonb_build_object('status', 'SALES_OPEN');
end;
$$;

create or replace function public.close_sales(p_event_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_event(p_event_id) then raise exception 'FORBIDDEN'; end if;
  update public.events set status = 'SALES_CLOSED' where id = p_event_id and status = 'SALES_OPEN';
  if not found then raise exception 'INVALID_TRANSITION'; end if;
  return jsonb_build_object('status', 'SALES_CLOSED');
end;
$$;

create or replace function public.mark_notifications_read(p_ids uuid[])
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.notifications set read_at = now()
  where user_id = auth.uid() and id = any(p_ids) and read_at is null;
end;
$$;

-- Called by initiate-payment edge function (service role) after Cashfree order create.
create or replace function public.record_payment_attempt(
  p_booking_id uuid,
  p_provider_order_id text,
  p_amount_minor bigint,
  p_idempotency_key text
) returns uuid language plpgsql security definer set search_path = public as $$
declare n int;
declare aid uuid;
declare b public.bookings%rowtype;
begin
  select * into b from public.bookings where id = p_booking_id for update;
  if b.id is null then raise exception 'BOOKING_NOT_FOUND'; end if;
  if b.expires_at < now() then raise exception 'RESERVATION_EXPIRED'; end if;
  if b.status not in ('RESERVED','PAYMENT_PENDING') then raise exception 'BOOKING_NOT_PAYABLE'; end if;
  if b.total_amount_minor <> p_amount_minor then raise exception 'AMOUNT_MISMATCH'; end if;

  select count(*) + 1 into n from public.payment_attempts where booking_id = p_booking_id;
  insert into public.payment_attempts (
    booking_id, provider_order_id, attempt_number, amount_minor, status, idempotency_key
  ) values (
    p_booking_id, p_provider_order_id, n, p_amount_minor, 'INITIATED', p_idempotency_key
  )
  on conflict (idempotency_key) do update set provider_order_id = excluded.provider_order_id
  returning id into aid;

  update public.bookings set status = 'PAYMENT_PENDING' where id = p_booking_id;
  return aid;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.app_users enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.organizers enable row level security;
alter table public.organizer_members enable row level security;
alter table public.organizer_verifications enable row level security;
alter table public.organizer_documents enable row level security;
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.event_online_details enable row level security;
alter table public.event_members enable row level security;
alter table public.refund_policies enable row level security;
alter table public.ticket_types enable row level security;
alter table public.registration_fields enable row level security;
alter table public.bookings enable row level security;
alter table public.reservations enable row level security;
alter table public.booking_items enable row level security;
alter table public.registration_answers enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.payments enable row level security;
alter table public.payment_webhooks enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_credentials enable row level security;
alter table public.check_ins enable row level security;
alter table public.refunds enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.settlements enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.audit_logs enable row level security;

create policy app_users_self on public.app_users for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_select on public.profiles for select using (user_id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy user_roles_self on public.user_roles for select using (user_id = auth.uid() or public.is_admin());

create policy organizers_public_select on public.organizers for select using (
  status = 'ACTIVE' or public.is_organizer_member(id) or public.is_admin()
);
create policy organizers_member_update on public.organizers for update using (public.is_organizer_member(id) or public.is_admin());
create policy organizers_insert on public.organizers for insert with check (created_by = auth.uid());

create policy organizer_members_select on public.organizer_members for select using (
  user_id = auth.uid() or public.is_organizer_member(organizer_id) or public.is_admin()
);
create policy organizer_members_manage on public.organizer_members for all using (
  public.is_organizer_member(organizer_id) or public.is_admin()
) with check (public.is_organizer_member(organizer_id) or public.is_admin());

create policy venues_select on public.venues for select using (true);
create policy venues_write on public.venues for all using (public.has_active_role('ORGANIZER') or public.is_admin())
  with check (public.has_active_role('ORGANIZER') or public.is_admin());

create policy events_select on public.events for select using (
  public.event_is_publicly_listed(status, visibility)
  or public.can_manage_event(id)
  or public.can_scan_event(id)
  or public.is_admin()
);
create policy events_insert on public.events for insert with check (
  created_by = auth.uid() and public.is_organizer_member(organizer_id)
);
create policy events_update on public.events for update using (public.can_manage_event(id) or public.is_admin());

create policy event_online_select on public.event_online_details for select using (
  exists (
    select 1 from public.tickets t where t.event_id = event_online_details.event_id and t.owner_user_id = auth.uid() and t.status in ('ACTIVE','USED')
  ) or public.can_manage_event(event_id) or public.is_admin()
);
create policy event_online_manage on public.event_online_details for all using (public.can_manage_event(event_id) or public.is_admin())
  with check (public.can_manage_event(event_id) or public.is_admin());

create policy event_members_select on public.event_members for select using (
  user_id = auth.uid() or public.can_manage_event(event_id) or public.is_admin()
);
create policy event_members_manage on public.event_members for all using (public.can_manage_event(event_id) or public.is_admin())
  with check (public.can_manage_event(event_id) or public.is_admin());

create policy refund_policies_select on public.refund_policies for select using (
  exists (select 1 from public.events e where e.id = event_id and (
    public.event_is_publicly_listed(e.status, e.visibility) or public.can_manage_event(e.id)
  ))
);
create policy refund_policies_manage on public.refund_policies for all using (public.can_manage_event(event_id) or public.is_admin())
  with check (public.can_manage_event(event_id) or public.is_admin());

create policy ticket_types_select on public.ticket_types for select using (
  (visibility = 'VISIBLE' and exists (
    select 1 from public.events e where e.id = event_id and public.event_is_publicly_listed(e.status, e.visibility)
  ))
  or public.can_manage_event(event_id) or public.is_admin()
);
create policy ticket_types_manage on public.ticket_types for all using (public.can_manage_event(event_id) or public.is_admin())
  with check (public.can_manage_event(event_id) or public.is_admin());

create policy registration_fields_select on public.registration_fields for select using (
  exists (select 1 from public.events e where e.id = event_id and (
    public.event_is_publicly_listed(e.status, e.visibility) or public.can_manage_event(e.id)
  ))
);
create policy registration_fields_manage on public.registration_fields for all using (public.can_manage_event(event_id) or public.is_admin())
  with check (public.can_manage_event(event_id) or public.is_admin());

create policy bookings_select on public.bookings for select using (
  user_id = auth.uid() or public.can_manage_event(event_id) or public.is_admin()
);
create policy reservations_select on public.reservations for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.user_id = auth.uid() or public.can_manage_event(b.event_id) or public.is_admin()))
);
create policy booking_items_select on public.booking_items for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.user_id = auth.uid() or public.can_manage_event(b.event_id) or public.is_admin()))
);
create policy registration_answers_select on public.registration_answers for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.user_id = auth.uid() or public.can_manage_event(b.event_id) or public.is_admin()))
);

create policy payments_select on public.payments for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.user_id = auth.uid() or public.can_manage_event(b.event_id) or public.is_admin()))
);
create policy payment_attempts_select on public.payment_attempts for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.user_id = auth.uid() or public.can_manage_event(b.event_id) or public.is_admin()))
);
-- No client policies on payment_webhooks (service role only).

create policy tickets_select on public.tickets for select using (
  owner_user_id = auth.uid() or public.can_manage_event(event_id) or public.is_admin()
);
create policy ticket_credentials_owner on public.ticket_credentials for select using (
  exists (select 1 from public.tickets t where t.id = ticket_id and t.owner_user_id = auth.uid())
);

create policy check_ins_select on public.check_ins for select using (
  public.can_scan_event(event_id) or public.can_manage_event(event_id) or public.is_admin()
);

create policy refunds_select on public.refunds for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.user_id = auth.uid() or public.can_manage_event(b.event_id) or public.is_admin()))
);

create policy ledger_organizer on public.ledger_entries for select using (
  public.is_admin() or public.is_organizer_member(organizer_id)
);
create policy settlements_organizer on public.settlements for select using (
  public.is_admin() or public.is_organizer_member(organizer_id)
);

create policy notifications_self on public.notifications for select using (user_id = auth.uid());
create policy notification_deliveries_self on public.notification_deliveries for select using (
  exists (select 1 from public.notifications n where n.id = notification_id and n.user_id = auth.uid())
);

create policy audit_admin on public.audit_logs for select using (public.is_admin());
create policy organizer_verifications_member on public.organizer_verifications for select using (
  public.is_organizer_member(organizer_id) or public.is_admin()
);
create policy organizer_documents_member on public.organizer_documents for select using (
  public.is_organizer_member(organizer_id) or public.is_admin()
);

-- RPCs: authenticated only. Service role bypasses RLS for webhooks.
grant execute on function public.reserve_booking(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.confirm_free_booking(uuid) to authenticated;
grant execute on function public.checkin_scan(uuid, text, text) to authenticated;
grant execute on function public.request_cancellation(uuid, text) to authenticated;
grant execute on function public.submit_event(uuid) to authenticated;
grant execute on function public.admin_review_event(uuid, boolean, text) to authenticated;
grant execute on function public.publish_event(uuid) to authenticated;
grant execute on function public.open_sales(uuid) to authenticated;
grant execute on function public.close_sales(uuid) to authenticated;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;
grant execute on function public.release_expired_reservations() to authenticated;
grant execute on function public.booking_fee_minor(int, boolean) to authenticated, anon;

revoke all on function public.apply_captured_payment(uuid, text, text, bigint, uuid) from public, anon, authenticated;
revoke all on function public.record_payment_attempt(uuid, text, bigint, text) from public, anon, authenticated;
grant execute on function public.apply_captured_payment(uuid, text, text, bigint, uuid) to service_role;
grant execute on function public.record_payment_attempt(uuid, text, bigint, text) to service_role;

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to authenticated;
grant select on public.events, public.ticket_types, public.organizers, public.venues, public.refund_policies, public.registration_fields to anon;
grant insert, update on public.profiles, public.organizers, public.organizer_members, public.venues, public.events, public.event_online_details, public.event_members, public.ticket_types, public.registration_fields, public.refund_policies to authenticated;
grant insert on public.audit_logs to authenticated;
