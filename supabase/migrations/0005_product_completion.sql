-- CtrlPass product completion: consents, referrals, volunteer invitations,
-- user settings, account deactivation. Idempotent additions only — no changes
-- to existing tables, RPCs or policies.

-- ============ user consents ============
create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document text not null check (document in ('TERMS', 'PRIVACY', 'DATA')),
  version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, document, version)
);

alter table public.user_consents enable row level security;

drop policy if exists "consents_self_insert" on public.user_consents;
create policy "consents_self_insert" on public.user_consents
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "consents_self_select" on public.user_consents;
create policy "consents_self_select" on public.user_consents
  for select to authenticated using (auth.uid() = user_id);

-- ============ referrals ============
create table if not exists public.referral_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'QUALIFIED' check (status in ('PENDING', 'QUALIFIED', 'REWARDED')),
  created_at timestamptz not null default now(),
  rewarded_at timestamptz
);

alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;

drop policy if exists "referral_codes_self" on public.referral_codes;
create policy "referral_codes_self" on public.referral_codes
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "referrals_referrer_select" on public.referrals;
create policy "referrals_referrer_select" on public.referrals
  for select to authenticated using (auth.uid() = referrer_id);

-- Returns the caller's referral code, creating one on first call.
create or replace function public.get_or_create_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_code text;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select code into v_code from public.referral_codes where user_id = v_user;
  if v_code is not null then
    return v_code;
  end if;

  -- 8-char A-Z0-9 code; retry on the (unlikely) unique collision.
  for attempt in 1..5 loop
    v_code := upper(substr(translate(encode(gen_random_bytes(8), 'base64'), '/+', 'XX'), 1, 8));
    begin
      insert into public.referral_codes (user_id, code) values (v_user, v_code);
      return v_code;
    exception when unique_violation then
      null;
    end;
  end loop;
  raise exception 'could_not_generate_referral_code';
end;
$$;

-- Applies a referral code for the current user. One-time, self-referral blocked.
create or replace function public.apply_referral(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_referrer uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select user_id into v_referrer from public.referral_codes where code = upper(trim(p_code));
  if v_referrer is null then
    return false;
  end if;
  if v_referrer = v_user then
    raise exception 'self_referral_not_allowed';
  end if;

  insert into public.referrals (referrer_id, referred_user_id, status)
  values (v_referrer, v_user, 'QUALIFIED')
  on conflict (referred_user_id) do nothing;

  return true;
end;
$$;

-- ============ volunteer invitations ============
create table if not exists public.volunteer_invitations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  email text not null,
  role text not null default 'VOLUNTEER' check (role in ('VOLUNTEER', 'SCANNER', 'EVENT_MANAGER')),
  status text not null default 'PENDING' check (status in ('PENDING', 'SENT', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
  token uuid not null default gen_random_uuid(),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz
);

create unique index if not exists volunteer_invitations_event_email_idx
  on public.volunteer_invitations (event_id, lower(email));

alter table public.volunteer_invitations enable row level security;

drop policy if exists "volunteer_invitations_manager_select" on public.volunteer_invitations;
create policy "volunteer_invitations_manager_select" on public.volunteer_invitations
  for select to authenticated
  using (public.can_manage_event(event_id));

drop policy if exists "volunteer_invitations_invitee_select" on public.volunteer_invitations;
create policy "volunteer_invitations_invitee_select" on public.volunteer_invitations
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Organizer creates (or re-invites) a volunteer for an event.
create or replace function public.invite_volunteer(p_event_id uuid, p_email text, p_role text default 'VOLUNTEER')
returns public.volunteer_invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.volunteer_invitations;
  v_row public.volunteer_invitations;
begin
  if not public.can_manage_event(p_event_id) then
    raise exception 'not_authorized';
  end if;
  if p_email is null or btrim(p_email) = '' or p_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid_email';
  end if;

  select * into v_existing
  from public.volunteer_invitations
  where event_id = p_event_id and lower(email) = lower(btrim(p_email));

  if v_existing.id is null then
    insert into public.volunteer_invitations (event_id, email, role, status, invited_by)
    values (p_event_id, lower(btrim(p_email)), p_role, 'PENDING', auth.uid())
    returning * into v_row;
  else
    if v_existing.status in ('ACCEPTED') then
      raise exception 'invitation_already_accepted';
    end if;
    update public.volunteer_invitations
    set status = 'PENDING', role = p_role, token = gen_random_uuid(),
        expires_at = now() + interval '14 days', updated_at = now(), invited_by = auth.uid()
    where id = v_existing.id
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

-- Organizer resends (re-queues) an invitation.
create or replace function public.resend_volunteer_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.volunteer_invitations i
    where i.id = p_invitation_id and public.can_manage_event(i.event_id)
  ) then
    raise exception 'not_authorized';
  end if;

  update public.volunteer_invitations
  set status = 'PENDING', expires_at = now() + interval '14 days', updated_at = now()
  where id = p_invitation_id and status in ('PENDING', 'SENT', 'EXPIRED');
end;
$$;

-- Organizer revokes an invitation.
create or replace function public.revoke_volunteer_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.volunteer_invitations i
    where i.id = p_invitation_id and public.can_manage_event(i.event_id)
  ) then
    raise exception 'not_authorized';
  end if;

  update public.volunteer_invitations
  set status = 'REVOKED', updated_at = now()
  where id = p_invitation_id and status in ('PENDING', 'SENT');
end;
$$;

-- Called by a volunteer after sign-in: activates matching invitations.
-- Marks them ACCEPTED and creates active event_members + VOLUNTEER role rows.
create or replace function public.accept_my_invitations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_count integer := 0;
  v_inv record;
begin
  if v_user is null or v_email = '' then
    return 0;
  end if;

  for v_inv in
    select * from public.volunteer_invitations
    where lower(email) = v_email
      and status in ('PENDING', 'SENT')
      and expires_at > now()
  loop
    update public.volunteer_invitations
    set status = 'ACCEPTED', accepted_at = now(), updated_at = now()
    where id = v_inv.id;

    insert into public.event_members (event_id, user_id, role, status)
    values (v_inv.event_id, v_user, v_inv.role, 'ACTIVE')
    on conflict (event_id, user_id, role) do update
      set status = 'ACTIVE', updated_at = now();

    insert into public.user_roles (user_id, role, status)
    values (v_user, 'VOLUNTEER', 'ACTIVE')
    on conflict (user_id, role) do update
      set status = 'ACTIVE';

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ============ user settings ============
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_self_select" on public.user_settings;
create policy "user_settings_self_select" on public.user_settings
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "user_settings_self_upsert" on public.user_settings;
create policy "user_settings_self_upsert" on public.user_settings
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "user_settings_self_update" on public.user_settings;
create policy "user_settings_self_update" on public.user_settings
  for update to authenticated using (auth.uid() = user_id);

-- ============ account deactivation ============
-- Soft-delete: marks the account DISABLED (sign-in blocked by status checks);
-- hard purge of PII remains an admin operation under the existing audit flow.
create or replace function public.request_account_deactivation()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  update public.app_users set status = 'DISABLED', updated_at = now() where user_id = v_user;
  update public.user_roles set status = 'REVOKED' where user_id = v_user and status = 'ACTIVE';

  insert into public.audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
  values (v_user, 'account.deactivation_requested', 'app_users', v_user,
          jsonb_build_object('requested_by', 'user'));
end;
$$;

-- ============ grants ============
grant execute on function public.get_or_create_referral_code() to authenticated;
grant execute on function public.apply_referral(text) to authenticated;
grant execute on function public.invite_volunteer(uuid, text, text) to authenticated;
grant execute on function public.resend_volunteer_invitation(uuid) to authenticated;
grant execute on function public.revoke_volunteer_invitation(uuid) to authenticated;
grant execute on function public.accept_my_invitations() to authenticated;
grant execute on function public.request_account_deactivation() to authenticated;
