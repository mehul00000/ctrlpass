export { isSupabaseConfigured } from './supabase/config';
export { createClient } from './supabase/client';
import { createClient } from './supabase/client';

/** Browser Supabase client (anon key only). */
export const supabase = createClient();
