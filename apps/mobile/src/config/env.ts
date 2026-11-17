/**
 * Mobile environment — Clerk + Convex (Supabase removed).
 * Values come from EXPO_PUBLIC_* env vars (.env) or hardcoded fallbacks below.
 */
export const ENV = {
  CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    'pk_test_c3VtbWFyeS1hbnRlYXRlci04NDc4LmNsZXJrLmFjY291bnRzLmRldiQ',
  CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL ?? 'https://efficient-trout-358.convex.cloud',
  // Set to 'production' for live Cashfree; anything else (incl. empty) uses sandbox.
  CASHFREE_ENV: process.env.EXPO_PUBLIC_CASHFREE_ENV ?? '',
} as const;

export function isBackendConfigured(): boolean {
  return Boolean(ENV.CONVEX_URL);
}
