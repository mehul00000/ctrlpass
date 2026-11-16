import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { json } from '../_shared/cors.ts';
import {
  extractPaymentEvent,
  isStaleTimestamp,
  mapCashfreePaymentStatus,
  verifyWebhookSignature,
} from '../_shared/cashfree.ts';

Deno.serve(async (req) => {
  const raw = await req.text();
  const timestamp = req.headers.get('x-webhook-timestamp') ?? '';
  const signature = req.headers.get('x-webhook-signature') ?? '';
  const secret = Deno.env.get('CASHFREE_SECRET_KEY') ?? '';

  let verified = false;
  try {
    verified = await verifyWebhookSignature(raw, timestamp, signature, secret);
  } catch {
    verified = false;
  }
  if (!verified) return json(req, { success: false, error: { code: 'INVALID_SIGNATURE' } }, 401);
  if (isStaleTimestamp(timestamp)) {
    return json(req, { success: false, error: { code: 'STALE_TIMESTAMP' } }, 401);
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json(req, { success: false, error: { code: 'INVALID_JSON' } }, 400);
  }

  const evt = extractPaymentEvent(payload);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Raw webhook is preserved verbatim; the unique (provider, provider_event_id) makes
  // duplicate deliveries a no-op (Cashfree retries until 2xx, so duplicates answer 200).
  const { error: hookErr } = await admin.from('payment_webhooks').insert({
    provider: 'CASHFREE',
    provider_event_id: evt.dedupeKey,
    event_type: evt.eventType,
    payload,
    signature,
    signature_verified: true,
    processing_status: 'PROCESSING',
  });
  if (hookErr?.code === '23505') {
    return json(req, { success: true, data: { duplicate: true } });
  }
  if (hookErr) return json(req, { success: false, error: { message: hookErr.message } }, 500);

  const failProcessing = async (code: string, status = 400) => {
    await admin
      .from('payment_webhooks')
      .update({ processing_status: 'PROCESSING_FAILED', processing_error: code })
      .eq('provider_event_id', evt.dedupeKey);
    return json(req, { success: false, error: { code } }, status);
  };

  const internalStatus = mapCashfreePaymentStatus(evt.paymentStatus);
  if (!evt.orderId) return json(req, { success: true, data: { ignored: 'no order reference' } });

  const { data: attempt } = await admin
    .from('payment_attempts')
    .select('id, booking_id, amount_minor, status')
    .eq('provider_order_id', evt.orderId)
    .maybeSingle();
  if (!attempt) return await failProcessing('UNKNOWN_ORDER');

  if (internalStatus === 'CAPTURED') {
    // Amount integrity: the provider amount (in paise) must equal the authoritative booking
    // total, and currency must be INR. apply_captured_payment re-checks the amount and
    // finalizes the booking, issues tickets exactly once, and is idempotent for replays.
    if (evt.amountMinor === null) return await failProcessing('MISSING_PAYMENT_AMOUNT');
    if (evt.paymentCurrency !== 'INR') return await failProcessing('UNSUPPORTED_CURRENCY');
    const { data, error } = await admin.rpc('apply_captured_payment', {
      p_booking_id: attempt.booking_id,
      p_provider_order_id: evt.orderId,
      p_provider_payment_id: String(evt.cfPaymentId ?? ''),
      p_amount_minor: evt.amountMinor,
      p_attempt_id: attempt.id,
    });
    await admin
      .from('payment_webhooks')
      .update({
        processing_status: error ? 'PROCESSING_FAILED' : 'PROCESSED',
        processed_at: new Date().toISOString(),
        processing_error: error?.message ?? null,
      })
      .eq('provider_event_id', evt.dedupeKey);
    if (error) return json(req, { success: false, error: { message: error.message } }, 400);
    return json(req, { success: true, data });
  }

  if (internalStatus === 'FAILED') {
    // Out-of-order guard: never downgrade an attempt the capture path already settled.
    await admin
      .from('payment_attempts')
      .update({
        status: 'FAILED',
        failure_reason: evt.failureReason ?? 'FAILED',
        completed_at: new Date().toISOString(),
      })
      .eq('id', attempt.id)
      .in('status', ['INITIATED', 'PENDING']);
  } else if (internalStatus === 'AUTHORIZED' || internalStatus === 'PENDING') {
    await admin
      .from('payment_attempts')
      .update({ status: internalStatus })
      .eq('id', attempt.id)
      .in('status', ['INITIATED']);
  }

  await admin
    .from('payment_webhooks')
    .update({ processing_status: 'PROCESSED', processed_at: new Date().toISOString() })
    .eq('provider_event_id', evt.dedupeKey);
  return json(req, { success: true });
});
