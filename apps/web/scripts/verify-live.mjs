// Live Supabase verification — runs the exact queries from src/services/* as anon.
// shortcut: read-only checks only, delete or keep for manual re-runs
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const checks = [
  ['venues (venue read, public)', () =>
    supabase.from('venues').select('*').eq('id', '11111111-1111-1111-1111-111111111111').maybeSingle()],
  ['events.listPublished (anon discovery)', () =>
    supabase.from('events')
      .select('*, venue:venues(*), organizer:organizers(*), ticket_types(*)')
      .eq('status', 'PUBLISHED')
      .order('start_at', { ascending: true })],
  ['organizer_members (anon must see nothing)', () =>
    supabase.from('organizer_members').select('organizer_id').eq('status', 'ACTIVE').limit(1)],
  ['bookings (anon must see nothing)', () =>
    supabase.from('bookings').select('id').limit(1)],
  ['payment_attempts (anon must see nothing)', () =>
    supabase.from('payment_attempts').select('id').limit(1)],
  ['payment_webhooks (anon must see nothing)', () =>
    supabase.from('payment_webhooks').select('id').limit(1)],
  ['tickets (anon must see nothing)', () =>
    supabase.from('tickets').select('id').limit(1)],
  ['ticket_credentials (anon must see nothing)', () =>
    supabase.from('ticket_credentials').select('ticket_id').limit(1)],
  ['apply_captured_payment RPC (anon must be rejected)', () =>
    supabase.rpc('apply_captured_payment', {
      p_booking_id: '00000000-0000-0000-0000-000000000000',
      p_provider_order_id: 'x', p_provider_payment_id: 'x',
      p_amount_minor: 0, p_attempt_id: '00000000-0000-0000-0000-000000000000',
    })],
  ['reserve_booking RPC (anon must be rejected)', () =>
    supabase.rpc('reserve_booking', { p_event_id: '00000000-0000-0000-0000-000000000000', p_items: [], p_attendee: {} })],
  ['bootstrap_my_organizer RPC (anon must be rejected)', () =>
    supabase.rpc('bootstrap_my_organizer', { p_name: 'Anon Org Probe' })],
  ['admin_review_event RPC (anon must be rejected)', () =>
    supabase.rpc('admin_review_event', { p_event_id: '00000000-0000-0000-0000-000000000000', p_approve: true })],
];

let failed = 0;
for (const [name, run] of checks) {
  const { data, error } = await run();
  const count = Array.isArray(data) ? data.length : data ? 1 : 0;
  const detail = error ? `error="${error.message}"` : `rows=${count}`;
  console.log(`${name}: ${detail}`);
  if (name.startsWith('venues') && !data) failed++;
  if (name.startsWith('events.listPublished') && error) failed++;
  if (name.includes('anon must see nothing') && count !== 0) failed++;
  if (name.includes('anon must be rejected') && !error) failed++;
  if (name.includes('bootstrap_my_organizer') && error && !/UNAUTHENTICATED|not configured|permission/i.test(error.message)) {
    console.log(`  ^ unexpected rejection reason, investigate`);
    failed++;
  }
}
console.log(failed === 0 ? 'ALL LIVE CHECKS PASSED' : `${failed} CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
