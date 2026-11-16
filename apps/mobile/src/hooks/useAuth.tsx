import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useClerk, useUser } from '@clerk/expo';

import { isSupabaseConfigured } from '../config/env';
import type { Profile, UserRole } from '../types';

/**
 * Application session — deliberately decoupled from Clerk/Supabase types so
 * screens keep working regardless of the identity provider behind the hook.
 * `user.id` is the CLERK user id; it is NOT a Supabase auth UUID and must not
 * be written into UUID-keyed database columns (identity mapping = Phase 3).
 */
export interface AppSessionUser {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
}

export interface AppSession {
  user: AppSessionUser;
}

type AuthValue = {
  session: AppSession | null;
  loading: boolean;
  profile: Profile | null;
  roles: UserRole[];
  accountStatus: string | null;
  consentAccepted: boolean;
  acceptConsent: () => void;
  configured: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const DEFAULT_AUTH_VALUE: AuthValue = {
  session: null,
  loading: true,
  profile: null,
  roles: [],
  accountStatus: null,
  consentAccepted: true,
  acceptConsent: () => {},
  configured: false,
  refresh: async () => {},
  signOut: async () => {},
};

const AuthContext =
  createContext<AuthValue>(DEFAULT_AUTH_VALUE);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerk = useClerk();
  const { isLoaded, isSignedIn, user } = useUser();

  const [loading, setLoading] = useState(true);

  const [profile] = useState<Profile | null>(null);

  const [accountStatus] = useState<string | null>('ACTIVE');

  /*
   * Keep this fail-open during migration exactly as the
   * existing application intends.
   *
   * Once consent enforcement is fully deployed, this should
   * be changed to fail-closed.
   */
  const [consentAccepted, setConsentAccepted] = useState(true);

  const configured = isSupabaseConfigured();

  /*
   * PHASE 3 PENDING — identity mapping:
   *
   * profiles / user_roles / user_consents are keyed by Supabase auth UUIDs and
   * RLS still expects auth.uid(). A Clerk id is not a UUID, so database
   * identity queries are intentionally NOT performed here: doing so would
   * either error (invalid uuid) or blindly write Clerk ids into UUID columns.
   * Until the mapping ships, every signed-in user gets the ATTENDEE fallback
   * role and no profile — same treatment the original flow gave a fresh user.
   */
  useEffect(() => {
    if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded]);

  const session = useMemo<AppSession | null>(() => {
    if (!isSignedIn || !user) return null;
    return {
      user: {
        id: user.id,
        email:
          user.primaryEmailAddress?.emailAddress ??
          user.emailAddresses[0]?.emailAddress ??
          null,
        phone: user.primaryPhoneNumber?.phoneNumber ?? null,
        fullName: user.fullName ?? null,
      },
    };
  }, [isSignedIn, user]);

  const roles = useMemo<UserRole[]>(
    () => (session ? ['ATTENDEE'] : []),
    [session],
  );

  const acceptConsent = useCallback(() => {
    setConsentAccepted(true);
  }, []);

  const refresh = useCallback(async () => {
    try {
      await user?.reload();
    } catch {
      // A failed reload keeps the current cached session state.
    }
  }, [user]);

  const signOut = useCallback(async () => {
    try {
      await clerk.signOut();
    } finally {
      setConsentAccepted(true);
    }
  }, [clerk]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      loading,
      profile,
      roles,
      accountStatus,
      consentAccepted,
      acceptConsent,
      configured,
      refresh,
      signOut,
    }),
    [
      session,
      loading,
      profile,
      roles,
      accountStatus,
      consentAccepted,
      acceptConsent,
      configured,
      refresh,
      signOut,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  return useContext(AuthContext);
}
