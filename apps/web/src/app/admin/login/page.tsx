'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SignIn, useAuth } from '@clerk/nextjs';
import { ShieldCheck } from 'lucide-react';

import BrandMark from '@/components/BrandMark';
import Navbar from '@/components/Navbar';
import { getRolesForCurrentUser, hasAnyRole } from '@/services/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { isSignedIn, userId } = useAuth();
  const redirected = useRef(false);

  // Admin gate: only ADMIN role proceeds, everyone else bounces back here.
  useEffect(() => {
    if (!isSignedIn || !userId || redirected.current) return;
    redirected.current = true;

    (async () => {
      try {
        const roles = await getRolesForCurrentUser();
        if (hasAnyRole(roles, ['ADMIN'])) {
          router.push('/admin/dashboard');
          return;
        }
      } catch {
        // fall through to the denial path
      }
      router.push('/admin/login?denied=1');
    })();
  }, [isSignedIn, userId, router]);

  const denied =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('denied') === '1';

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F2]">
      <Navbar />

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D6B47A]/[0.035] blur-[120px]"
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="rounded-3xl border border-white/[0.08] bg-[#080808] p-6 shadow-2xl shadow-black/40 sm:p-8">
            <div className="mb-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-[#D6B47A]/20 bg-[#D6B47A]/10">
                  <ShieldCheck className="h-8 w-8 text-[#D6B47A]" />
                </div>
              </div>

              <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#D6B47A]">
                Admin Command Center
              </p>

              <h1 className="font-display text-2xl font-bold tracking-tight text-[#F5F5F2]">
                Administrator sign-in
              </h1>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#77736C]">
                Restricted access. Only accounts with the ADMIN role can enter
                the administrative console.
              </p>
            </div>

            {denied && (
              <div className="mb-5 rounded-xl border border-[#D96B6B]/20 bg-[#D96B6B]/[0.06] p-4 text-xs text-[#D96B6B]">
                This account does not have ADMIN permissions.
              </div>
            )}

            <SignIn
              signUpUrl="/signup"
              forceRedirectUrl="/admin/login"
              fallbackRedirectUrl="/admin/login"
              appearance={{
                variables: {
                  colorPrimary: '#D6B47A',
                  colorBackground: '#080808',
                  colorText: '#F5F5F2',
                  colorInputBackground: '#111111',
                  colorInputText: '#F5F5F2',
                  borderRadius: '0.75rem',
                },
                elements: {
                  card: 'bg-[#080808] border border-white/[0.08] shadow-none',
                  socialButtonsBlockButton:
                    'border border-white/[0.08] bg-[#111111] text-[#F5F5F2] hover:bg-[#151515]',
                  formFieldInput: 'bg-[#111111] border-white/[0.08]',
                  footerActionLink: 'text-[#D6B47A] hover:text-[#E0C38E]',
                },
              }}
            />
          </div>

          <p className="mt-5 text-center font-mono text-[9px] uppercase tracking-[0.15em] text-[#77736C]/70">
            Restricted area · CtrlPass
          </p>
        </div>
      </main>
    </div>
  );
}
