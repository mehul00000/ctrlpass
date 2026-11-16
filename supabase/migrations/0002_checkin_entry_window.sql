-- Return distinct gate statuses and honour event entry windows.

alter table public.check_ins drop constraint if exists check_ins_result_check;
alter table public.check_ins
  add constraint check_ins_result_check
  check (result in (
    'SUCCESS',
    'DUPLICATE',
    'INVALID',
    'CANCELLED',
    'EXPIRED',
    'WRONG_EVENT',
    'ENTRY_NOT_OPEN',
    'ENTRY_CLOSED'
  ));

create or replace function public.checkin_scan(p_event_id uuid, p_qr_token text, p_device text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
declare token text;
declare hash text;
declare t public.tickets%rowtype;
declare tt public.ticket_types%rowtype;
declare ev public.events%rowtype;
declare pname text;
declare opens_at timestamptz;
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.can_scan_event(p_event_id) then
    insert into public.check_ins (event_id, scanned_by, result, device_reference)
    values (p_event_id, uid, 'INVALID', p_device);
    return jsonb_build_object('success', false, 'status', 'UNAUTHORIZED', 'message', 'Not authorized to scan this event.');
  end if;

  select * into ev from public.events where id = p_event_id;
  if ev.id is null then
    return jsonb_build_object('success', false, 'status', 'INVALID', 'message', 'Event not found.');
  end if;

  opens_at := coalesce(ev.doors_open_at, ev.start_at);
  if opens_at is not null and now() < opens_at then
    insert into public.check_ins (event_id, scanned_by, result, device_reference)
    values (p_event_id, uid, 'ENTRY_NOT_OPEN', p_device);
    return jsonb_build_object(
      'success', false,
      'status', 'ENTRY_NOT_OPEN',
      'message', 'Entry is not open yet.'
    );
  end if;
  if ev.end_at is not null and now() > ev.end_at then
    insert into public.check_ins (event_id, scanned_by, result, device_reference)
    values (p_event_id, uid, 'ENTRY_CLOSED', p_device);
    return jsonb_build_object(
      'success', false,
      'status', 'ENTRY_CLOSED',
      'message', 'Entry is closed for this event.'
    );
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
    return jsonb_build_object('success', false, 'status', 'WRONG_EVENT', 'message', 'Wrong event.');
  end if;

  if t.status = 'USED' then
    insert into public.check_ins (ticket_id, event_id, scanned_by, result, device_reference)
    values (t.id, p_event_id, uid, 'DUPLICATE', p_device);
    return jsonb_build_object('success', false, 'status', 'DUPLICATE', 'ticket_id', t.id,
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
    return jsonb_build_object('success', false, 'status', 'DUPLICATE', 'message', 'Already checked in.');
  end if;

  insert into public.check_ins (ticket_id, event_id, scanned_by, result, device_reference)
  values (t.id, p_event_id, uid, 'SUCCESS', p_device);

  select * into tt from public.ticket_types where id = t.ticket_type_id;
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
