/**
 * Unit tests for the shared Cashfree payment logic (supabase/functions/_shared/cashfree.ts)
 * and the booking-fee mirror (@ctrlpass/types). Node 22 provides the WebCrypto globals these
 * modules use, so the edge-function code is testable without Deno.
 */
/// <reference lib="dom" />
import {
  extractPaymentEvent,
  isStaleTimestamp,
  mapCashfreePaymentStatus,
  toMinor,
  verifyWebhookSignature,
} from '../../../../supabase/functions/_shared/cashfree';
import { bookingFeeMinor } from '../../../../packages/types/src';

// ─── Booking fee (mirror of the authoritative SQL booking_fee_minor) ───
describe('bookingFeeMinor', () => {
  it('charges 0 for free events and non-positive counts', () => {
    expect(bookingFeeMinor(0, true)).toBe(0);
    expect(bookingFeeMinor(5, false)).toBe(0);
    expect(bookingFeeMinor(3, true)).toBe(3000 + 2 * 500);
  });

  it('is flat ₹30 + ₹5 per extra ticket, capped at ₹60', () => {
    expect(bookingFeeMinor(1, true)).toBe(3000);
    expect(bookingFeeMinor(2, true)).toBe(3500);
    expect(bookingFeeMinor(7, true)).toBe(6000);
    expect(bookingFeeMinor(10, true)).toBe(6000);
  });
});

// ─── Provider amount conversion ───
describe('toMinor', () => {
  it('converts rupees to paise with correct rounding', () => {
    expect(toMinor(100)).toBe(10000);
    expect(toMinor(99.5)).toBe(9950);
    expect(toMinor(0.1 + 0.2)).toBe(30);
  });

  it('rejects missing or invalid amounts', () => {
    expect(toMinor(undefined)).toBeNull();
    expect(toMinor(null)).toBeNull();
    expect(toMinor(NaN)).toBeNull();
    expect(toMinor(-1)).toBeNull();
  });
});

// ─── Webhook signature verification ───
describe('verifyWebhookSignature', () => {
  const secret = 'test-webhook-secret';

  async function sign(raw: string, timestamp: string, withSecret = secret): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(withSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(timestamp + raw));
    return btoa(String.fromCharCode(...new Uint8Array(sig)));
  }

  it('accepts a correctly signed payload', async () => {
    const raw = JSON.stringify({ type: 'PAYMENT_SUCCESS' });
    const ts = String(Math.floor(Date.now() / 1000));
    await expect(verifyWebhookSignature(raw, ts, await sign(raw, ts), secret)).resolves.toBe(true);
  });

  it('rejects a tampered payload', async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = await sign(JSON.stringify({ type: 'PAYMENT_SUCCESS' }), ts);
    await expect(
      verifyWebhookSignature(JSON.stringify({ type: 'PAYMENT_FAILED' }), ts, sig, secret)
    ).resolves.toBe(false);
  });

  it('rejects a signature made with a different secret', async () => {
    const raw = '{}';
    const ts = String(Math.floor(Date.now() / 1000));
    await expect(verifyWebhookSignature(raw, ts, await sign(raw, ts, 'wrong'), secret)).resolves.toBe(false);
  });

  it('rejects malformed signature material and missing inputs', async () => {
    const raw = '{}';
    const ts = String(Math.floor(Date.now() / 1000));
    await expect(verifyWebhookSignature(raw, ts, 'not-base64!!!', secret)).resolves.toBe(false);
    await expect(verifyWebhookSignature(raw, ts, 'AAAA', '')).resolves.toBe(false);
    await expect(verifyWebhookSignature(raw, '', 'AAAA', secret)).resolves.toBe(false);
  });
});

// ─── Replay protection ───
describe('isStaleTimestamp', () => {
  it('accepts a fresh timestamp and rejects stale or malformed ones', () => {
    const now = String(Math.floor(Date.now() / 1000));
    expect(isStaleTimestamp(now)).toBe(false);
    expect(isStaleTimestamp(String(Math.floor(Date.now() / 1000) - 400))).toBe(true);
    expect(isStaleTimestamp('not-a-number')).toBe(true);
    expect(isStaleTimestamp('')).toBe(true);
  });
});

// ─── Provider → internal state mapping ───
describe('mapCashfreePaymentStatus', () => {
  it('maps verified provider events onto the existing internal states', () => {
    expect(mapCashfreePaymentStatus('SUCCESS')).toBe('CAPTURED');
    expect(mapCashfreePaymentStatus('FAILED')).toBe('FAILED');
    expect(mapCashfreePaymentStatus('AUTHORIZED')).toBe('AUTHORIZED');
    expect(mapCashfreePaymentStatus('PENDING')).toBe('PENDING');
  });

  it('returns null for unknown statuses so they are only logged', () => {
    expect(mapCashfreePaymentStatus('USER_DROPPED')).toBeNull();
    expect(mapCashfreePaymentStatus(undefined)).toBeNull();
  });
});

// ─── Webhook payload extraction ───
describe('extractPaymentEvent', () => {
  it('extracts order, payment, amount and currency from a Cashfree payload', () => {
    const evt = extractPaymentEvent({
      type: 'PAYMENT_SUCCESS',
      data: {
        order: { order_id: 'cpabc' },
        payment: {
          cf_payment_id: 12345,
          payment_status: 'SUCCESS',
          payment_amount: 350,
          payment_currency: 'INR',
        },
      },
    });
    expect(evt.orderId).toBe('cpabc');
    expect(evt.paymentStatus).toBe('SUCCESS');
    expect(evt.amountMinor).toBe(35000);
    expect(evt.paymentCurrency).toBe('INR');
    expect(evt.dedupeKey).toBe('12345');
  });

  it('does not invent an amount when the provider omits it', () => {
    const evt = extractPaymentEvent({ data: { order: { order_id: 'cpabc' }, payment: { payment_status: 'SUCCESS' } } });
    expect(evt.amountMinor).toBeNull();
  });
});
