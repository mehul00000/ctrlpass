'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SignIn, useAuth } from '@clerk/nextjs';

import BrandMark from '@/components/BrandMark';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { getRolesForCurrentUser, hasAnyRole } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const { isSignedIn, userId } = useAuth();
  const redirected = useRef(false);

  // Role-aware redirect: admins → admin console, staff → organizer workspace.
  useEffect(() => {
    if (!isSignedIn || !userId || redirected.current) return;
    redirected.current = true;

    (async () => {
      let target = '/';
      try {
        const roles = await getRolesForCurrentUser();
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get('redirect_url') ?? searchParams.get('redirect');
        if (redirectUrl && redirectUrl.startsWith('/')) {
          target = redirectUrl;
        } else if (hasAnyRole(roles, ['ADMIN'])) {
          target = '/admin/dashboard';
        } else if (hasAnyRole(roles, ['ORGANIZER'])) {
          target = '/organizer/dashboard';
        }
      } catch {
        target = '/';
      }
      router.push(target);
    })();
  }, [isSignedIn, userId, router]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F2]">
      <Navbar />

      <main className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-5 py-16 sm:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D6B47A]/[0.035] blur-[120px]"
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="rounded-3xl border border-white/[0.08] bg-[#080808] p-6 shadow-2xl shadow-black/40 sm:p-8">
            <div className="mb-8 text-center">
              <div className="mb-6 flex justify-center">
                <BrandMark
                  href={null}
                  size={72}
                  showWordmark={false}
                  variant="app"
                />
              </div>

              <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#D6B47A]">
                CtrlPass Account
              </p>

              <h1 className="font-display text-2xl font-bold tracking-tight text-[#F5F5F2]">
                Welcome back
              </h1>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#77736C]">
                Sign in to access your passes, organizer workspace, or
                administrative console.
              </p>
            </div>

            <SignIn
              signUpUrl="/signup"
              forceRedirectUrl="/"
              fallbackRedirectUrl="/"
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

            <div className="mt-7 border-t border-white/[0.07] pt-6 text-center">
              <p className="text-xs text-[#77736C]">
                Need an organizer account?{' '}
                <Link
                  href="/signup"
                  className="font-semibold text-[#D6B47A] transition-colors hover:text-[#E0C38E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]/50"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-5 text-center font-mono text-[9px] uppercase tracking-[0.15em] text-[#77736C]/70">
            Secure access · CtrlPass
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
