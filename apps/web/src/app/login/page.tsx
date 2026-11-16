'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
} from 'lucide-react';

import BrandMark from '@/components/BrandMark';
import ConfigNotice from '@/components/ConfigNotice';
import Footer from '@/components/Footer';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Navbar from '@/components/Navbar';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getRoles, hasAnyRole } from '@/services/auth';

// Inlined at build time — enables the Clerk Google flow when keys are present.
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
        );
      }

      const { data: signInData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        throw authError;
      }

      const userId = signInData.user?.id;

      if (!userId) {
        throw new Error(
          'Sign-in succeeded but no authenticated session was returned.'
        );
      }

      const roles = await getRoles(supabase, userId);
      const isAdmin = hasAnyRole(roles, ['ADMIN']);
      const isStaff = hasAnyRole(roles, ['ORGANIZER', 'ADMIN']);

      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect');

      if (redirectUrl && redirectUrl.startsWith('/')) {
        router.push(redirectUrl);
      } else if (isAdmin) {
        router.push('/admin/dashboard');
      } else if (isStaff) {
        router.push('/organizer/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to sign in. Please check your credentials.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

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

            {!isSupabaseConfigured && <ConfigNotice />}

            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-xl border border-[#D96B6B]/20 bg-[#D96B6B]/[0.06] p-4 text-xs text-[#D96B6B]"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-5">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#A7A39B]"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736C]" />

                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#111111] py-3.5 pl-10 pr-4 text-sm text-[#F5F5F2] outline-none transition-colors placeholder:text-[#77736C] hover:border-white/[0.12] focus:border-[#D6B47A]/40 focus:ring-2 focus:ring-[#D6B47A]/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="login-password"
                    className="block font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#A7A39B]"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="rounded text-xs font-medium text-[#D6B47A] transition-colors hover:text-[#E0C38E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]/50"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736C]" />

                  <input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#111111] py-3.5 pl-10 pr-4 text-sm text-[#F5F5F2] outline-none transition-colors placeholder:text-[#77736C] hover:border-white/[0.12] focus:border-[#D6B47A]/40 focus:ring-2 focus:ring-[#D6B47A]/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isSupabaseConfigured}
                className="group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D6B47A] px-5 py-3.5 text-sm font-semibold text-[#050505] transition-all hover:bg-[#E0C38E] hover:shadow-lg hover:shadow-[#D6B47A]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In'}

                {!loading && (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </button>
            </form>

            {clerkEnabled && (
              <>
                <div
                  className="mt-7 flex items-center gap-4"
                  role="separator"
                  aria-label="Or continue with"
                >
                  <span className="h-px flex-1 bg-white/[0.07]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#77736C]">
                    or
                  </span>
                  <span className="h-px flex-1 bg-white/[0.07]" />
                </div>

                <div className="mt-6">
                  <GoogleSignInButton onError={setError} />
                </div>
              </>
            )}

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