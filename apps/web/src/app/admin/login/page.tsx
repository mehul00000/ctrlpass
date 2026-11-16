'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';

import BrandMark from '@/components/BrandMark';
import Navbar from '@/components/Navbar';
import ConfigNotice from '@/components/ConfigNotice';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getRoles, hasAnyRole } from '@/services/auth';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY.',
        );
      }

      const { data: signInData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {
        throw authError;
      }

      const userId = signInData.user?.id;

      if (!userId) {
        throw new Error(
          'Sign-in succeeded but no user session was returned.',
        );
      }

      const roles = await getRoles(supabase, userId);

      if (!hasAnyRole(roles, ['ADMIN'])) {
        await supabase.auth.signOut();
        throw new Error(
          'Administrator role required for this console.',
        );
      }

      router.push('/admin/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F2]">
      <Navbar />

      <main className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-5 py-12 sm:px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D6B47A]/[0.055] blur-[140px]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(214,180,122,0.035)_0,transparent_45%)]" />
        </div>

        <div className="relative z-10 w-full max-w-[430px]">
          <div className="mb-6 flex items-center justify-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6B47A]/20 bg-[#D6B47A]/10 text-[#D6B47A]">
              <ShieldCheck className="h-4 w-4" />
            </div>

            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#77736C]">
              Restricted Access
            </span>
          </div>

          <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl shadow-black/40">
            <div className="border-b border-white/[0.06] px-6 pb-6 pt-8 sm:px-9 sm:pt-9">
              <div className="flex justify-center">
                <BrandMark
                  href={null}
                  size={64}
                  showWordmark={false}
                  variant="app"
                />
              </div>

              <div className="mt-6 text-center">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#D6B47A]">
                  CtrlPass Administration
                </p>

                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#F5F5F2]">
                  Admin Console
                </h1>

                <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-[#77736C]">
                  Sign in with an authorized administrator account to continue.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-9">
              {!isSupabaseConfigured && (
                <div className="mb-5">
                  <ConfigNotice />
                </div>
              )}

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#D96B6B]/20 bg-[#D96B6B]/[0.06] p-4 text-xs text-[#D96B6B]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-5">
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-2 block text-[10px] font-medium uppercase tracking-[0.14em] text-[#A7A39B]"
                  >
                    Administrator Email
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736C]" />

                    <input
                      id="admin-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="admin@ctrlpass.in"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#111111] py-3.5 pl-11 pr-4 text-sm text-[#F5F5F2] outline-none placeholder:text-[#55524D] transition focus:border-[#D6B47A]/45 focus:bg-[#141414]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-password"
                    className="mb-2 block text-[10px] font-medium uppercase tracking-[0.14em] text-[#A7A39B]"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736C]" />

                    <input
                      id="admin-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#111111] py-3.5 pl-11 pr-4 text-sm text-[#F5F5F2] outline-none placeholder:text-[#55524D] transition focus:border-[#D6B47A]/45 focus:bg-[#141414]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isSupabaseConfigured}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#D6B47A] py-3.5 text-sm font-semibold text-[#050505] transition hover:bg-[#E0C38E] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? 'Authenticating...' : 'Enter Admin Console'}

                  {!loading && (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  )}
                </button>
              </form>

              <div className="mt-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />

                <span className="text-[9px] uppercase tracking-[0.14em] text-[#55524D]">
                  Authorized personnel only
                </span>

                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-xs text-[#77736C] transition hover:text-[#D6B47A]"
                >
                  Go to Organizer Login
                </Link>
              </div>
            </div>
          </section>

          <p className="mt-5 text-center text-[10px] text-[#55524D]">
            CtrlPass Admin · Protected platform workspace
          </p>
        </div>
      </main>
    </div>
  );
}