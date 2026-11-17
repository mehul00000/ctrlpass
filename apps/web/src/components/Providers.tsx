import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';

type ProvidersProps = {
  children: ReactNode;
};

// Clerk is the sole auth provider (Supabase removed). The publishable key is
// public-safe and always required for sign-in to work.
export default function Providers({ children }: ProvidersProps) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
