// Origin allowlist from EDGE_ALLOWED_ORIGINS (comma-separated).
// shortcut: unset EDGE_ALLOWED_ORIGINS falls back to '*' for local dev; set it before production.
const allowedOrigins = (Deno.env.get('EDGE_ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  if (allowedOrigins.length === 0) return baseCorsHeaders;
  if (origin && allowedOrigins.includes(origin)) {
    return { ...baseCorsHeaders, 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
  }
  const { 'Access-Control-Allow-Origin': _drop, ...rest } = baseCorsHeaders;
  return { ...rest, Vary: 'Origin' };
}

const baseCorsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key, x-cron-secret',
};

/** OPTIONS preflight + POST-only gate. Returns a Response to send, or null to continue. */
export function guard(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsFor(req) });
  if (req.method !== 'POST') return json(req, { success: false, error: { code: 'METHOD_NOT_ALLOWED' } }, 405);
  return null;
}

export function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsFor(req), 'Content-Type': 'application/json' },
  });
}
