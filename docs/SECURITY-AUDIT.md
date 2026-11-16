# Security Audit — 2026-10-28

Focused review using the [Cloudflare security-audit-skill](https://github.com/cloudflare/security-audit-skill)
(guidance mode): trust boundaries = Supabase Edge Functions, RLS policies, Cashfree payment flow,
client apps. Every finding below names the boundary crossed and the fix **applied in this repo**.

## What is already solid (verified, no change)

- **Webhook authenticity**: `cashfree-webhook` verifies Cashfree's HMAC-SHA256 signature
  (`timestamp + body`) before any state change; rejects with 401 otherwise.
- **Money integrity**: `apply_captured_payment` (service-role only) enforces `AMOUNT_MISMATCH`
  against the booking total; `record_payment_attempt` re-checks amount + booking state.
  Amounts never originate from client input.
- **Webhook idempotency**: unique `provider_event_id` → duplicate deliveries return `{duplicate: true}`.
- **Secrets**: Cashfree credentials live only in edge-function env; no secrets in client code;
  `.env` gitignored; `.env.example` has placeholders only.
- **RLS**: every table has policies; payment capture RPCs revoked from `anon`/`authenticated`
  and granted only to `service_role`. Ownership enforced via RLS on booking reads in
  `initiate-payment` (user JWT client), not the service-role client.

## Findings fixed today

| # | Severity | Finding | Fix |
|---|----------|---------|-----|
| 1 | Medium | All edge functions sent `Access-Control-Allow-Origin: *` on authenticated endpoints. Any website could invoke them cross-origin with any token it obtained. | `_shared/cors.ts` now echoes `Origin` only when listed in `EDGE_ALLOWED_ORIGINS` (unset = dev wildcard, documented shortcut). |
| 2 | Medium | `cashfree-webhook` had no timestamp freshness check — a captured (signed) webhook could be replayed later; dedup only covers identical event IDs. | Rejects webhooks whose `x-webhook-timestamp` skews > 5 min from server time. |
| 3 | Medium | `expire-reservations` was unauthenticated — anyone could hammer a service-role RPC (minor DoS / load vector). | Requires `x-cron-secret` header matching `CRON_SECRET` when that env is set. |
| 4 | Low | State-changing functions accepted any HTTP method (e.g. GET with no body → unhandled parse error). | `guard()` in `_shared/cors.ts`: OPTIONS preflight or POST only, else 405. |
| 5 | Low | Webhook body `JSON.parse` outside try/catch could 500 on malformed body. | Wrapped; returns 400 `INVALID_JSON`. |

## Functional gap fixed (payments)

Mobile `OrderSummaryScreen` called `initiatePayment` and **discarded the payment session** —
paid checkout never opened on Android; bookings could only complete for free tickets.
Now wired to the official `react-native-cashfree-pg-sdk` drop-in (`doWebPayment`), which
verifies order ID on callback; booking settlement remains webhook-authoritative via the
existing `BookingStatus` polling. **Requires an Android rebuild** (new native module).

## Needs validation (cannot confirm from source)

- Cashfree dashboard webhook URL points at the deployed `cashfree-webhook` function.
- `EDGE_ALLOWED_ORIGINS`, `CRON_SECRET` set in Supabase edge-function env before production.
- Production values for `CASHFREE_APP_ID/SECRET_KEY` (`CASHFREE_ENV=production`) and mobile
  `ENV.CASHFREE_ENV='production'` in `apps/mobile/src/config/env.ts`.

## Skipped

- No SQL-level review of `reserve_booking`/`checkin_scan` internals beyond money paths.
- No dynamic testing (skill forbids live-endpoint probing; no local Supabase stack here).
