// Pure Cashfree helpers shared by edge functions. No Deno-specific imports, so the
// same module is unit-testable under Node (mobile jest) — keep it that way.
/// <reference lib="dom" />
export const CASHFREE_API_VERSION = '2023-08-01';

export function cashfreeBaseUrl(env: string | undefined): string {
  return env === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
}

// Cashfree signs `${timestamp}${rawBody}` with HMAC-SHA256, base64-encoded.
// Uses crypto.subtle.verify so the comparison is constant-time.
export async function verifyWebhookSignature(
  raw: string,
  timestamp: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!secret || !signature || !timestamp) return false;
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(timestamp + raw));
  } catch {
    return false;
  }
}

// Replay guard: Cashfree signs unix-seconds timestamps.
export function isStaleTimestamp(timestamp: string, maxSkewSec = 300): boolean {
  const tsSec = Number(timestamp);
  if (!Number.isFinite(tsSec)) return true;
  return Math.abs(Date.now() - tsSec * 1000) > maxSkewSec * 1000;
}

// Cashfree order_amount is rupees (decimal); internal money is paise (integer).
export function toMinor(rupees: number | undefined | null): number | null {
  if (typeof rupees !== 'number' || !Number.isFinite(rupees) || rupees < 0) return null;
  return Math.round(rupees * 100);
}

export type InternalPaymentStatus = 'INITIATED' | 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED';

// Cashfree payment_status → existing payment_attempts.status. Unknown/other statuses
// (e.g. provider-specific terminal variants) return null and are only logged.
export function mapCashfreePaymentStatus(status: string | undefined | null): InternalPaymentStatus | null {
  switch (status) {
    case 'SUCCESS':
      return 'CAPTURED';
    case 'AUTHORIZED':
      return 'AUTHORIZED';
    case 'PENDING':
      return 'PENDING';
    case 'FAILED':
      return 'FAILED';
    default:
      return null;
  }
}

export interface CashfreePaymentEvent {
  eventType: string | undefined;
  orderId: string | undefined;
  cfPaymentId: string | undefined;
  paymentStatus: string | undefined;
  paymentCurrency: string | undefined;
  amountMinor: number | null;
  failureReason: string | undefined;
  dedupeKey: string;
}

// Extract the fields the webhook acts on. Trusted only after signature verification.
export function extractPaymentEvent(payload: any): CashfreePaymentEvent {
  const payment = payload?.data?.payment ?? {};
  const amountMinor = toMinor(payment.payment_amount);
  return {
    eventType: payload?.type ?? payload?.event_type,
    orderId: payload?.data?.order?.order_id,
    cfPaymentId: payment.cf_payment_id,
    paymentStatus: payment.payment_status,
    paymentCurrency: payment.payment_currency,
    amountMinor,
    failureReason: payment.payment_message,
    dedupeKey: String(payment.cf_payment_id ?? payload?.event_time ?? crypto.randomUUID()),
  };
}
