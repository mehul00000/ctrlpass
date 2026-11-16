'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Mail,
} from 'lucide-react';

import BrandMark from '@/components/BrandMark';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConfigNotice from '@/components/ConfigNotice';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY.',
        );
      }

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login`,
        });

      if (resetError) {
        throw resetError;
      }

      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send the recovery link. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#050505] text-[#F5F5F2]">
      <Navbar />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-12 sm:px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D6B47A]/[0.045] blur-[150px]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(214,180,122,0.025)_0,transparent_48%)]" />
        </div>

        <div className="relative z-10 w-full max-w-[430px]">
          <div className="mb-6 flex items-center justify-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6B47A]/20 bg-[#D6B47A]/10 text-[#D6B47A]">
              <LockKeyhole className="h-4 w-4" />
            </div>

            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#77736C]">
              Account Recovery
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
                  CtrlPass Account
                </p>

                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#F5F5F2]">
                  Reset Password
                </h1>

                <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#77736C]">
                  Enter your registered email and we&apos;ll send instructions
                  to create a new password.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-9">
              {!isSupabaseConfigured && (
                <div className="mb-5">
                  <ConfigNotice />
                </div>
              )}

              {sent ? (
                <div className="py-2 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#7FBF9A]/20 bg-[#7FBF9A]/[0.07] text-[#7FBF9A]">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>

                  <h2 className="mt-5 text-lg font-semibold text-[#F5F5F2]">
                    Check your inbox
                  </h2>

                  <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#77736C]">
                    If an account exists for{' '}
                    <span className="font-medium text-[#A7A39B]">
                      {email}
                    </span>
                    , you&apos;ll receive instructions to reset your password.
                  </p>

                  <Link
                    href="/login"
                    className="mt-7 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111111] px-4 py-3 text-xs font-medium text-[#A7A39B] transition hover:border-[#D6B47A]/30 hover:text-[#F5F5F2]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Sign In
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-5">
                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 rounded-xl border border-[#D96B6B]/20 bg-[#D96B6B]/[0.06] p-4 text-xs text-[#D96B6B]"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="leading-relaxed">{error}</span>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="reset-email"
                      className="mb-2 block text-[10px] font-medium uppercase tracking-[0.14em] text-[#A7A39B]"
                    >
                      Account Email
                    </label>

                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736C]" />

                      <input
                        id="reset-email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full rounded-xl border border-white/[0.08] bg-[#111111] py-3.5 pl-11 pr-4 text-sm text-[#F5F5F2] outline-none placeholder:text-[#55524D] transition focus:border-[#D6B47A]/45 focus:bg-[#141414]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !isSupabaseConfigured}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#D6B47A] py-3.5 text-sm font-semibold text-[#050505] transition hover:bg-[#E0C38E] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loading ? 'Sending...' : 'Send Recovery Link'}

                    {!loading && (
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </button>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="h-px flex-1 bg-white/[0.06]" />

                    <span className="text-[9px] uppercase tracking-[0.14em] text-[#55524D]">
                      Secure recovery
                    </span>

                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>

                  <div className="pt-1 text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-xs text-[#77736C] transition hover:text-[#D6B47A]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to Sign In
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </section>

          <p className="mt-5 text-center text-[10px] text-[#55524D]">
            CtrlPass · Account recovery
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}