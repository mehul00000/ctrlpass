import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { guard, json } from '../_shared/cors.ts';
import { CASHFREE_API_VERSION, cashfreeBaseUrl } from '../_shared/cashfree.ts';

/**
 * Cashfree PG order create. Secrets stay on the server.
 * Idempotent per booking: the provider order id is deterministic (cp<booking>) and the
 * payment session is persisted on the attempt, so a retry returns the same order/session
 * instead of creating duplicate provider orders or financial records.
 * Easy Split live settlement remains PENDING per DECISIONS_AND_OPEN_QUESTIONS — not executed here.
 */
Deno.serve(async (req) => {
  const g = guard(req);
  if (g) return g;
  const auth = req.headers.get('Authorization');
  if (!auth) return json(req, { success: false, error: { code: 'UNAUTHENTICATED', message: 'Missing session' } }, 401);

  const { booking_id } = await req.json();
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Fetched through the caller's client: RLS means a user can only pay for their own booking.
  const { data: booking, error } = await userClient
    .from('bookings')
    .select('*')
    .eq('id', booking_id)
    .single();
  if (error || !booking) return json(req, { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } }, 404);
  if (booking.total_amount_minor === 0) {
    return json(req, { success: false, error: { code: 'FREE_BOOKING', message: 'Use free confirmation' } }, 400);
  }
  if (booking.status !== 'RESERVED' && booking.status !== 'PAYMENT_PENDING') {
    return json(req, { success: false, error: { code: 'BOOKING_NOT_PAYABLE', message: 'This booking is no longer awaiting payment' } }, 409);
  }
  if (booking.expires_at && new Date(booking.expires_at).getTime() < Date.now()) {
    return json(req, { success: false, error: { code: 'RESERVATION_EXPIRED', message: 'Your 10-minute hold expired. Please book again.' } }, 410);
  }

  const appId = Deno.env.get('CASHFREE_APP_ID');
  const secret = Deno.env.get('CASHFREE_SECRET_KEY');
  const env = Deno.env.get('CASHFREE_ENV') === 'production' ? 'production' : 'sandbox';
  if (!appId || !secret) {
    return json(req, { success: false, error: { code: 'PAYMENTS_UNCONFIGURED', message: 'Cashfree credentials are not configured' } }, 503);
  }

  // Retry path: an already-created provider order reuses its session verbatim (a FAILED
  // payment attempt keeps the order alive at Cashfree, so the user retries on the same order).
  const { data: existing } = await admin
    .from('payment_attempts')
    .select('id, provider_order_id, provider_session_id, amount_minor')
    .eq('booking_id', booking.id)
    .in('status', ['INITIATED', 'PENDING', 'AUTHORIZED', 'FAILED'])
    .order('initiated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.provider_session_id) {
    return json(req, {
      success: true,
      data: {
        payment_attempt_id: existing.id,
        order_id: existing.provider_order_id,
        amount_minor: existing.amount_minor,
        currency: 'INR',
        checkout_data: {
          payment_session_id: existing.provider_session_id,
          order_token: existing.provider_session_id,
        },
      },
    });
  }

  const orderId = `cp${booking.id.replaceAll('-', '')}`;
  const amountRupees = (booking.total_amount_minor / 100).toFixed(2);
  const cfRes = await fetch(`${cashfreeBaseUrl(env)}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': CASHFREE_API_VERSION,
      'x-client-id': appId,
      'x-client-secret': secret,
      // Provider-side idempotency: a retried create with the same key returns the original response.
      'x-idempotency-key': `cp-order:${booking.id}`,
    },
    body: JSON.stringify({
      order_id: orderId,
      order_amount: Number(amountRupees),
      order_currency: 'INR',
      customer_details: {
        customer_id: booking.user_id,
        customer_email: booking.attendee_email,
        customer_phone: booking.attendee_phone || '0000000000',
        customer_name: booking.attendee_name,
      },
      order_meta: { return_url: Deno.env.get('CASHFREE_RETURN_URL') ?? undefined },
    }),
  });
  const cfBody = await cfRes.json();
  if (!cfRes.ok) {
    return json(req, { success: false, error: { code: 'CASHFREE_ERROR', message: cfBody?.message ?? 'Cashfree order failed' } }, 502);
  }

  const idempotency = req.headers.get('x-idempotency-key') ?? `pay:${booking.id}`;
  const { data: attemptId, error: recErr } = await admin.rpc('record_payment_attempt', {
    p_booking_id: booking.id,
    p_provider_order_id: orderId,
    p_amount_minor: booking.total_amount_minor,
    p_idempotency_key: idempotency,
  });
  if (recErr) return json(req, { success: false, error: { code: 'ATTEMPT_FAILED', message: recErr.message } }, 400);

  // Persist the session so retries never need a second provider order.
  await admin
    .from('payment_attempts')
    .update({ provider_session_id: cfBody.payment_session_id })
    .eq('id', attemptId);

  return json(req, {
    success: true,
    data: {
      payment_attempt_id: attemptId,
      order_id: orderId,
      amount_minor: booking.total_amount_minor,
      currency: 'INR',
      checkout_data: {
        payment_session_id: cfBody.payment_session_id,
        order_token: cfBody.payment_session_id,
      },
    },
  });
});
