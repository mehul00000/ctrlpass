"use client";

// ---------------------------------------------------------------------------
// UserContext — a single identity surface used by every component.
//   mode "clerk": real Clerk session (active as soon as keys are provided)
//   mode "local": no auth configured yet; features persist to localStorage
// ---------------------------------------------------------------------------

import { createContext, useContext, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";

export const LOCAL_USER_ID = "local-user";

export interface CurrentUser {
  userId: string;
  name: string;
  email: string;
  imageUrl: string | null;
  signedIn: boolean;
  mode: "clerk" | "local";
}

export interface UserContextValue {
  user: CurrentUser;
  loading: boolean;
  /** Sign out helper — no-op in local mode. */
  signOut: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue>({
  user: {
    userId: LOCAL_USER_ID,
    name: "Guest",
    email: "",
    imageUrl: null,
    signedIn: false,
    mode: "local",
  },
  loading: false,
  signOut: async () => {},
});

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function UserProvider({ children }: { children: React.ReactNode }) {
  if (CLERK_ENABLED) {
    return <ClerkUserProvider>{children}</ClerkUserProvider>;
  }
  return (
    <UserContext.Provider
      value={{
        user: {
          userId: LOCAL_USER_ID,
          name: "Guest",
          email: "",
          imageUrl: null,
          signedIn: false,
          mode: "local",
        },
        loading: false,
        signOut: async () => {},
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

function ClerkUserProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  const syncMe = useMutation(api.userData.syncMe);

  // Mirror the Clerk session into the Convex `users` table once per session.
  // Clerk stays the source of truth for authentication.
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      syncMe({
        username: user.fullName ?? user.username ?? "Member",
        email: user.primaryEmailAddress?.emailAddress ?? "",
        imageUrl: user.imageUrl ?? null,
      }).catch(() => {});
    }
  }, [isLoaded, isSignedIn, syncMe, user]);

  const value: UserContextValue = {
    user: {
      userId: isSignedIn && user ? user.id : LOCAL_USER_ID,
      name: isSignedIn && user ? (user.fullName ?? user.username ?? "Member") : "Guest",
      email: isSignedIn && user ? (user.primaryEmailAddress?.emailAddress ?? "") : "",
      imageUrl: isSignedIn && user ? user.imageUrl : null,
      signedIn: Boolean(isSignedIn),
      mode: "clerk",
    },
    loading: !isLoaded,
    signOut: () => clerk.signOut(),
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useCurrentUser(): UserContextValue {
  return useContext(UserContext);
}
