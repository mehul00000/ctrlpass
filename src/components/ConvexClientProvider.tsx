"use client";

// ---------------------------------------------------------------------------
// Convex client bound to the Clerk session (official Clerk integration).
// The Clerk JWT template "convex" supplies the token; convex/auth.config.ts
// verifies it against the deployment's CLERK_ISSUER + CLERK_JWT_PUBLIC_KEY.
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/clerk-react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => new ConvexReactClient(url), []);
  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
