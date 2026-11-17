import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/expo';

import { setClerkTokenProvider, isBackendConfigured, authedClient } from '../lib/convex';
import { api } from '../../../../convex/_generated/api';
import type { Profile, UserRole } from '../types';

/**
 * Application session — Clerk identity + Convex profile/roles.
 * `user.id` is the Clerk user id; the Convex app_users row is mapped from it
 * server-side (get-or-create on every authenticated call).
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

const AuthContext = createContext<AuthValue>(DEFAULT_AUTH_VALUE);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerk = useClerk();
  const clerkAuth = useClerkAuth();
  const { isLoaded, isSignedIn, user } = useUser();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accountStatus, setAccountStatus] = useState<string | null>('ACTIVE');
  const [backendRoles, setBackendRoles] = useState<UserRole[]>([]);

  /*
   * Consent is fail-open during migration, matching the existing flow.
   * Change to fail-closed once consent enforcement ships fully.
   */
  const [consentAccepted, setConsentAccepted] = useState(true);

  const configured = isBackendConfigured();

  // Register the Clerk token provider so services can call Convex with auth.
  useEffect(() => {
    setClerkTokenProvider(async () => {
      try {
        return await clerkAuth.getToken({ template: 'convex' });
      } catch {
        return null;
      }
    });
  }, [clerkAuth]);

  // Load profile + roles from the Convex backend (get-or-create app user).
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !configured) {
      setProfile(null);
      setBackendRoles(sessionLessRoles(isSignedIn));
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const me: any = await (await authedClient()).query(api.users.me, {});
        if (cancelled) return;
        setProfile((me?.profile ?? null) as Profile | null);
        setAccountStatus(me?.user?.status ?? 'ACTIVE');
        setBackendRoles((me?.roles ?? []).map((r: any) => r.role as UserRole));
        // Activate pending volunteer invitations matching this email.
        try {
          await (await authedClient()).mutation(api.volunteers.acceptMyInvitations, {});
        } catch {
          // non-fatal
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
          setBackendRoles(sessionLessRoles(true));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id, configured]);

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
    () => (session ? (backendRoles.length ? backendRoles : ['ATTENDEE']) : []),
    [session, backendRoles],
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
      setProfile(null);
      setBackendRoles([]);
    }
  }, [clerk]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      loading: isLoaded ? (isSignedIn && configured ? loading : false) : true,
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
      isLoaded,
      isSignedIn,
      configured,
      profile,
      roles,
      accountStatus,
      consentAccepted,
      acceptConsent,
      refresh,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function sessionLessRoles(signedIn: boolean): UserRole[] {
  return signedIn ? ['ATTENDEE'] : [];
}

export function useAuth(): AuthValue {
  return useContext(AuthContext);
}
