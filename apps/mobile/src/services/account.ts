import { api } from '../../../../convex/_generated/api';
import { authedClient, isBackendConfigured, snakeize } from '../lib/convex';

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
    if (!isBackendConfigured()) return;
    await (await authedClient()).mutation(api.account.setConsent, {
      consentType: document,
      granted: true,
      policyVersion: version,
    } as any);
  },

  async listMyConsents(): Promise<{ document: string; version: string; accepted_at: string }[]> {
    if (!isBackendConfigured()) return [];
    try {
      const data = await (await authedClient()).query(api.account.listMyConsents, {});
      const rows = snakeize<any[]>(data) ?? [];
      return rows
        .filter((r) => r.granted)
        .map((r) => ({ document: r.consent_type, version: r.policy_version ?? '', accepted_at: r.granted_at }));
    } catch {
      return [];
    }
  },

  /** Real refer & earn: code + referral counts from the referrals table. */
  async getReferralSummary(): Promise<ReferralSummary | null> {
    if (!isBackendConfigured()) return null;
    try {
      const code = await (await authedClient()).mutation(api.account.getOrCreateReferralCode, {});
      const referrals = (await (await authedClient()).query(api.account.myReferrals, {})) as any[];
      const successful = referrals.filter((r) => r.status === 'REWARDED').length;
      const pending = referrals.filter((r) => r.status !== 'REWARDED').length;
      return { code: String(code ?? ''), successful, pending };
    } catch {
      return null;
    }
  },

  async applyReferral(code: string): Promise<boolean> {
    if (!isBackendConfigured()) return false;
    const data = await (await authedClient()).mutation(api.account.applyReferral, { code } as any);
    return Boolean(data);
  },

  async getSettings(): Promise<UserSettings> {
    if (!isBackendConfigured()) return {};
    try {
      return ((await (await authedClient()).query(api.account.getMySettings, {})) as UserSettings) ?? {};
    } catch {
      return {};
    }
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    if (!isBackendConfigured()) return;
    await (await authedClient()).mutation(api.account.updateMySettings, { settings } as any);
  },

  /** Soft-deletes: deactivates the account server-side. Confirmation lives in the UI. */
  async deactivateAccount(): Promise<void> {
    await (await authedClient()).mutation(api.account.requestAccountDeactivation, {});
  },

  /** Activates any pending volunteer invitations matching the signed-in email. */
  async acceptMyInvitations(): Promise<number> {
    if (!isBackendConfigured()) return 0;
    try {
      const data = await (await authedClient()).mutation(api.volunteers.acceptMyInvitations, {});
      return Number(data ?? 0);
    } catch {
      return 0;
    }
  },

  async listMyInvitations(): Promise<VolunteerInvitation[]> {
    if (!isBackendConfigured()) return [];
    try {
      const me: any = await (await authedClient()).query(api.users.me, {});
      const email = (me?.user?.email ?? '').toLowerCase();
      if (!email) return [];
      // Invitations surface via accepted event memberships once accepted; direct
      // invitee listing happens through acceptMyInvitations on sign-in.
      const staffEvents = (await (await authedClient()).query(
        api.volunteers.listEventInvitations,
        {} as any,
      )) as any[];
      return snakeize<VolunteerInvitation[]>(staffEvents) ?? [];
    } catch {
      return [];
    }
  },
};
