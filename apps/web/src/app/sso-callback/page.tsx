'use client';

import Link from 'next/link';
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

import BrandMark from '@/components/BrandMark';

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-[#F5F5F2]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D6B47A]/[0.035] blur-[120px]"
      />

      <div className="relative z-10 w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <BrandMark
            href={null}
            size={64}
            showWordmark={false}
            variant="app"
          />
        </div>

        <div
          aria-hidden="true"
          className="mx-auto mb-6 h-8 w-8 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#D6B47A]"
        />

        <h1 className="font-display text-xl font-bold tracking-tight">
          Completing sign-in
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#77736C]">
          Finishing your Google authentication — this only takes a moment.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-block rounded-lg text-xs font-medium text-[#D6B47A] transition-colors hover:text-[#E0C38E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]/50"
        >
          Cancel and return to sign in
        </Link>
      </div>
    </div>
  );
}
