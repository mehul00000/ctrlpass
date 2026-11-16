-- 0006_clerk_identity.sql — Clerk identity mapping groundwork
--
-- Prepares the database for Clerk as the identity provider WITHOUT removing
-- Supabase Auth and WITHOUT touching existing rows or policies.
--
-- Why a shadow auth.users row: app_users.id and profiles.id/user_id carry
-- `references auth.users(id) on delete cascade`. Every existing FK, join and
-- RLS policy assumes the application user IS an auth.users row. Rather than
-- rewrite the schema (destructive, forbidden), a Clerk-authenticated user gets
-- a shadow auth.users row (no password, no session — Supabase Auth is not used
-- by the client) whose id backs app_users/profiles/user_roles exactly as
-- before. The Clerk user id is mapped to it via user_identity.
--
-- RLS: existing auth.uid()-based policies keep working for Supabase Auth
-- clients (the web app). For Clerk JWTs, auth.uid() is NULL (sub is not a
-- UUID), so user-scoped policies must be swapped to public.requesting_user_id()
-- in a follow-up migration once the Clerk integration path is confirmed —
-- deliberately NOT done blind here; every policy rewrite must be tested.
--
-- REQUIREMENTS BEFORE CLERK CLIENTS WORK END TO END (dashboard-side):
--   1. Clerk: enable Native API, configure the Google social connection,
--      obtain the publishable key for the mobile client.
--   2. Supabase: enable third-party auth for Clerk so validated Clerk JWTs
--      are exposed as request.jwt.claims to PostgREST.

create or replace function public.requesting_user_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    sub text;
begin
    sub := nullif(current_setting('request.jwt.claim.sub', true), '');

    -- Supabase Auth path: sub is already the application user UUID.
    if sub is not null and sub ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        return sub::uuid;
    end if;

    -- Clerk path: map the Clerk user id (sub) to the application user.
    if sub is not null then
        return (
            select ui.user_id
            from public.user_identity ui
            where ui.clerk_user_id = sub
        );
    end if;

    return null;
end;
$$;

create table if not exists public.user_identity (
    id uuid primary key default gen_random_uuid(),
    clerk_user_id text not null unique,
    user_id uuid not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.user_identity enable row level security;

create policy user_identity_self_select on public.user_identity for select using (
    user_id = public.requesting_user_id() or public.is_admin()
);
create policy user_identity_self_update on public.user_identity for update using (
    user_id = public.requesting_user_id() or public.is_admin()
) with check (
    user_id = public.requesting_user_id() or public.is_admin()
);

-- One-time bootstrap for a newly authenticated Clerk user.
-- Idempotent: safe to call on every sign-in.
create or replace function public.bootstrap_clerk_user(
    p_clerk_user_id text,
    p_email text default null,
    p_phone text default null,
    p_full_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_user_id uuid;
begin
    if p_clerk_user_id is null or length(trim(p_clerk_user_id)) = 0 then
        raise exception 'clerk_user_id is required';
    end if;

    select ui.user_id into v_user_id
    from public.user_identity ui
    where ui.clerk_user_id = p_clerk_user_id;

    if v_user_id is null then
        -- Shadow auth.users row: satisfies the FKs below; never used for
        -- Supabase Auth sign-in (no password, session or email confirmation).
        insert into auth.users (
            instance_id, id, aud, role, email,
            raw_user_meta_data, created_at, updated_at,
            confirmation_token, recovery_token, email_change_token_new, email_change
        ) values (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            p_email,
            jsonb_build_object('provider', 'clerk', 'clerk_user_id', p_clerk_user_id),
            now(), now(),
            '', '', '', ''
        )
        returning id into v_user_id;

        insert into public.app_users (id, email, status)
        values (v_user_id, p_email, 'ACTIVE');

        insert into public.profiles (id, user_id, full_name, phone)
        values (v_user_id, v_user_id, nullif(trim(coalesce(p_full_name, '')), ''), p_phone);

        insert into public.user_roles (user_id, role, status)
        values (v_user_id, 'ATTENDEE', 'ACTIVE');

        insert into public.user_identity (clerk_user_id, user_id)
        values (p_clerk_user_id, v_user_id);
    else
        update public.app_users
        set email = coalesce(p_email, email), updated_at = now()
        where id = v_user_id;

        update public.profiles
        set phone = coalesce(p_phone, phone), updated_at = now()
        where id = v_user_id;

        update public.user_identity
        set updated_at = now()
        where clerk_user_id = p_clerk_user_id;
    end if;

    return v_user_id;
end;
$$;

revoke all on function public.bootstrap_clerk_user(text, text, text, text) from public;
grant execute on function public.bootstrap_clerk_user(text, text, text, text) to authenticated, anon;
