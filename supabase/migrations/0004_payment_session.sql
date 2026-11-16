-- Cashfree payment integration glue (additive; no new tables/RPCs).
-- The payment session id returned at Cashfree order creation cannot be re-fetched later,
-- so it is stored server-side to make initiate-payment idempotent: a retry returns the
-- SAME provider order + session instead of creating duplicate provider orders.
alter table public.payment_attempts add column provider_session_id text;
