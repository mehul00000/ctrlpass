import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { guard, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const g = guard(req);
  if (g) return g;
  const auth = req.headers.get('Authorization');
  if (!auth) return json(req, { success: false, error: { code: 'UNAUTHENTICATED', message: 'Missing session' } }, 401);

  const body = await req.json();
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  });

  const { data, error } = await supabase.rpc('reserve_booking', {
    p_event_id: body.event_id,
    p_items: body.items,
    p_attendee: body.attendee,
  });
  if (error) return json(req, { success: false, error: { code: 'RESERVE_FAILED', message: error.message } }, 400);
  return json(req, { success: true, data });
});
