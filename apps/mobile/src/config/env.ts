/**
 * Fill SUPABASE_URL / SUPABASE_ANON_KEY before connecting to a live project.
 * shortcut: local placeholders so the Android binary boots; replace before production.
 */
export const ENV = {
  SUPABASE_URL: 'https://dkczkbroqoxlvzmztkni.supabase.co' as string,
  SUPABASE_ANON_KEY: 'sb_publishable_YOMSP-UjKreKZMWRmXooUg_m4XiW4S2' as string,
  // Set to 'production' for live Cashfree; anything else (incl. empty) uses sandbox.
  CASHFREE_ENV: '' as string,
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY);
}
