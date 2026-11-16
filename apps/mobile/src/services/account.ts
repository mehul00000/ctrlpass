import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../config/env';

// Consent documents shown to users; bump versions when terms change.
export const CONSENT_DOCS = {
  TERMS: { document: 'TERMS' as const, version: '2026-10-01' },
  PRIVACY: { document: 'PRIVACY' as const, version: '2026-10-01' },
  DATA: { document: 'DATA' as const, version: '2026-10-01' },
};

export interface ReferralSummary {
  code: string;
  successful: number;
  pending: number;
}

export interface VolunteerInvitation {
  id: string;
  event_id: string;
  email: string;
  role: 'VOLUNTEER' | 'SCANNER' | 'EVENT_MANAGER';
  status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  event?: { name: string };
}

export interface UserSettings {
  booking_updates?: boolean;
  event_reminders?: boolean;
  promotions?: boolean;
  [key: string]: boolean | undefined;
}

export const accountService = {
  /** Records user consent for a document/version. Called from the consent screen. */
  async recordConsent(document: 'TERMS' | 'PRIVACY' | 'DATA', version: string): Promise<void> {
    if (!isSupabaseConfigured()) return; // recorded on first session with backend
    const { error } = await supabase
      .from('user_consents')
      .insert({ document, version });
    if (error) throw error;
  },

  async listMyConsents(): Promise<{ document: string; version: string; accepted_at: string }[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('user_consents')
      .select('document, version, accepted_at')
      .order('accepted_at', { ascending: false });
    if (error) return [];
    return data;
  },

  /** Real refer & earn: code + referral counts from the referrals table. */
  async getReferralSummary(): Promise<ReferralSummary | null> {
    if (!isSupabaseConfigured()) return null;
    const { data: code, error: codeError } = await supabase.rpc('get_or_create_referral_code');
    if (codeError) return null;
    const { count: successful } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'REWARDED');
    const { count: pending } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'REWARDED');
    return { code: String(code ?? ''), successful: successful ?? 0, pending: pending ?? 0 };
  },

  async applyReferral(code: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const { data, error } = await supabase.rpc('apply_referral', { p_code: code });
    if (error) throw error;
    return Boolean(data);
  },

  async getSettings(): Promise<UserSettings> {
    if (!isSupabaseConfigured()) return {};
    const { data } = await supabase
      .from('user_settings')
      .select('settings')
      .single();
    return (data?.settings as UserSettings) ?? {};
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase
      .from('user_settings')
      .upsert({ settings }, { onConflict: 'user_id' });
    if (error) throw error;
  },

  /** Soft-deletes: deactivates the account server-side. Confirmation lives in the UI. */
  async deactivateAccount(): Promise<void> {
    const { error } = await supabase.rpc('request_account_deactivation');
    if (error) throw error;
  },

  /** Activates any pending volunteer invitations matching the signed-in email. */
  async acceptMyInvitations(): Promise<number> {
    if (!isSupabaseConfigured()) return 0;
    const { data, error } = await supabase.rpc('accept_my_invitations');
    if (error) return 0;
    return Number(data ?? 0);
  },

  async listMyInvitations(): Promise<VolunteerInvitation[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('volunteer_invitations')
      .select('*, event:events(name)')
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data ?? []) as VolunteerInvitation[];
  },
};
