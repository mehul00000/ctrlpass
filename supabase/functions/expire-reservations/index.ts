import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // shortcut: if CRON_SECRET is unset this stays open (dev); set it before production so only the scheduler can fire this.
  const secret = Deno.env.get('CRON_SECRET');
  if (secret && req.headers.get('x-cron-secret') !== secret) {
    return json(req, { success: false, error: { code: 'UNAUTHORIZED' } }, 401);
  }
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data, error } = await admin.rpc('release_expired_reservations');
  if (error) return json(req, { success: false, error: { message: error.message } }, 500);
  return json(req, { success: true, data: { released: data } });
});
