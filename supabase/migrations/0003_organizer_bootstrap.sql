-- Organizer bootstrap + lifecycle glue (additive; no table changes).
-- Product intent: organizer signup is self-serve (web signup posts role='ORGANIZER' metadata);
-- the control point is event review (submit_event/admin_review_event) before publication.

-- Honor organizer signup intent: grant the ORGANIZER app role at signup.
-- Roles are still never client-assignable: only this trigger writes them.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.app_users (id, email, status)
  values (new.id, new.email, case when new.email_confirmed_at is not null then 'ACTIVE' else 'PENDING' end);
  insert into public.profiles (id, user_id) values (new.id, new.id);
  insert into public.user_roles (user_id, role, status) values (new.id, 'ATTENDEE', 'ACTIVE');
  if coalesce(new.raw_user_meta_data->>'role', '') = 'ORGANIZER' then
    insert into public.user_roles (user_id, role, status) values (new.id, 'ORGANIZER', 'ACTIVE');
  end if;
  return new;
end;
$$;

-- Self-serve bootstrap: creates the caller's own organizer + OWNER membership in one
-- transaction. Idempotent: returns the existing active membership. Cannot attach the
-- caller to an organizer they are not already a member of (membership is created only
-- for the organizer created here, mirroring organizers_insert: created_by = auth.uid()).
create or replace function public.bootstrap_my_organizer(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  org_id uuid;
begin
  if uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;
  if p_name is null or length(btrim(p_name)) < 2 then
    raise exception 'ORGANIZER_NAME_REQUIRED';
  end if;

  select m.organizer_id into org_id
    from public.organizer_members m
    where m.user_id = uid and m.status = 'ACTIVE'
    order by m.created_at
    limit 1;
  if org_id is not null then
    return org_id;
  end if;

  insert into public.organizers (name, type, status, verification_status, created_by, email)
  values (btrim(p_name), 'EXTERNAL', 'ACTIVE', 'PENDING', uid,
    (select email from auth.users where id = uid))
  returning id into org_id;

  insert into public.organizer_members (organizer_id, user_id, membership_role, status, joined_at)
  values (org_id, uid, 'OWNER', 'ACTIVE', now());

  insert into public.user_roles (user_id, role, status)
  values (uid, 'ORGANIZER', 'ACTIVE')
  on conflict (user_id, role) do update
    set status = 'ACTIVE', revoked_at = null
    where public.user_roles.status <> 'ACTIVE';

  return org_id;
end;
$$;

revoke execute on function public.bootstrap_my_organizer(text) from public, anon;
grant execute on function public.bootstrap_my_organizer(text) to authenticated;
