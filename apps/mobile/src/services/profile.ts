import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../config/env';
import { AppNotification, Profile, UserRole } from '../types';

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) return null;
    return data as Profile;
  },

  async getAppUser(userId: string) {
    if (!isSupabaseConfigured()) return null;
    const { data } = await supabase.from('app_users').select('*').eq('id', userId).single();
    return data as { status: string; email: string | null } | null;
  },

  async upsertProfile(userId: string, updates: Partial<Profile>) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase credentials required to save profile.');
    }
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, user_id: userId, ...updates, updated_at: new Date().toISOString() });
    return { error };
  },

  async getUserRoles(userId: string): Promise<UserRole[]> {
    if (!isSupabaseConfigured()) return ['ATTENDEE'];
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE');
    return (data ?? []).map((r: { role: UserRole }) => r.role);
  },

  async listNotifications(): Promise<AppNotification[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    } catch {
      return [];
    }
  },

  async markNotificationsRead(ids: string[]): Promise<void> {
    if (!isSupabaseConfigured() || ids.length === 0) return;
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', ids);
    } catch {
      // Ignore
    }
  },
};
