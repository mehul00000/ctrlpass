import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  if (!clerkPublishableKey) {
    // Clerk keys are not set yet — render the app unchanged instead of
    // crashing on a missing publishable key (mirrors the Supabase fallback).
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
