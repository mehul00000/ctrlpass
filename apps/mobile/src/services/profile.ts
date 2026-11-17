import { api } from '../../../../convex/_generated/api';
import { authedClient, isBackendConfigured, snakeize } from '../lib/convex';
import { AppNotification, Profile, UserRole } from '../types';

export const profileService = {
  async getProfile(_userId: string): Promise<Profile | null> {
    if (!isBackendConfigured()) return null;
    try {
      const me: any = await (await authedClient()).query(api.users.me, {});
      return (snakeize<Profile>(me?.profile) ?? null) as Profile | null;
    } catch {
      return null;
    }
  },

  async getAppUser(_userId: string) {
    if (!isBackendConfigured()) return null;
    try {
      const me: any = await (await authedClient()).query(api.users.me, {});
      return me?.user ? { status: me.user.status, email: me.user.email ?? null } : null;
    } catch {
      return null;
    }
  },

  async upsertProfile(_userId: string, updates: Partial<Profile>) {
    if (!isBackendConfigured()) {
      throw new Error('Convex URL required to save profile.');
    }
    await (await authedClient()).mutation(api.users.updateProfile, {
      fullName: updates.full_name,
      phone: updates.phone,
      city: updates.city,
      state: updates.state,
      profileImageUrl: (updates as any).profile_image_url,
    } as any);
    return { error: null };
  },

  async getUserRoles(_userId: string): Promise<UserRole[]> {
    if (!isBackendConfigured()) return ['ATTENDEE'];
    try {
      const me: any = await (await authedClient()).query(api.users.me, {});
      return (me?.roles ?? []).map((r: any) => r.role as UserRole);
    } catch {
      return ['ATTENDEE'];
    }
  },

  async listNotifications(): Promise<AppNotification[]> {
    if (!isBackendConfigured()) return [];
    try {
      const data = await (await authedClient()).query(api.organizers.listMyNotifications, {});
      return (snakeize<AppNotification[]>(data) ?? []) as AppNotification[];
    } catch {
      return [];
    }
  },

  async markNotificationsRead(ids: string[]): Promise<void> {
    if (!isBackendConfigured() || ids.length === 0) return;
    try {
      await (await authedClient()).mutation(api.organizers.markNotificationsRead, {
        notificationIds: ids as any,
      } as any);
    } catch {
      // Ignore
    }
  },
};
