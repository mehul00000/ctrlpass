'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Building,
  CheckCircle,
  Lock,
  Mail,
  User,
} from 'lucide-react';

import BrandMark from '@/components/BrandMark';
import ConfigNotice from '@/components/ConfigNotice';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyEmail, setVerifyEmail] = useState('');

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
        );
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            organization_name: orgName,
            role: 'ORGANIZER',
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        router.push('/organizer/dashboard');
      } else {
        setVerifyEmail(email);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to register account.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F2]">
      <Navbar />

      <main className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-5 py-12 sm:px-6 lg:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D6B47A]/[0.035] blur-[130px]"
        />

        <div className="relative z-10 w-full max-w-lg">
          <div className="rounded-3xl border border-white/[0.08] bg-[#080808] p-6 shadow-2xl shadow-black/40 sm:p-8">
            {verifyEmail ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#7FBF9A]/20 bg-[#7FBF9A]/[0.07]">
                  <CheckCircle className="h-7 w-7 text-[#7FBF9A]" />
                </div>

                <p className="mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#D6B47A]">
                  Verification Required
                </p>

                <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#F5F5F2]">
                  Check your inbox
                </h1>

                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#77736C]">
                  We sent a confirmation link to{' '}
                  <strong className="font-medium text-[#F5F5F2]">
                    {verifyEmail}
                  </strong>
                  . Confirm your email to activate your organization account.
                </p>

                <Link
                  href="/login"
                  className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-[#D6B47A] px-6 py-3 text-sm font-semibold text-[#050505] transition-all hover:bg-[#E0C38E] hover:shadow-lg hover:shadow-[#D6B47A]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]/60"
                >
                  Go to Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            ) : (
              <>
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
                    Organizer Access
                  </p>

                  <h1 className="font-display text-2xl font-bold tracking-tight text-[#F5F5F2]">
                    Create your organization
                  </h1>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#77736C]">
                    Build events, manage ticketing, and operate your experiences
                    through CtrlPass.
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

                <form onSubmit={handleSignup} className="space-y-5">
                  <Field
                    id="signup-name"
                    label="Your Full Name"
                    icon={User}
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Vikram Mehta"
                    value={name}
                    onChange={setName}
                  />

                  <Field
                    id="signup-org"
                    label="Organization or Brand"
                    icon={Building}
                    type="text"
                    autoComplete="organization"
                    placeholder="e.g. Sunburn Campus / IIT Bombay"
                    value={orgName}
                    onChange={setOrgName}
                  />

                  <Field
                    id="signup-email"
                    label="Work Email"
                    icon={Mail}
                    type="email"
                    autoComplete="email"
                    placeholder="organizer@domain.com"
                    value={email}
                    onChange={setEmail}
                  />

                  <Field
                    id="signup-password"
                    label="Password"
                    icon={Lock}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={setPassword}
                  />

                  <button
                    type="submit"
                    disabled={loading || !isSupabaseConfigured}
                    className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D6B47A] px-5 py-3.5 text-sm font-semibold text-[#050505] transition-all hover:bg-[#E0C38E] hover:shadow-lg hover:shadow-[#D6B47A]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}

                    {!loading && (
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </button>
                </form>

                <div className="mt-7 border-t border-white/[0.07] pt-6 text-center">
                  <p className="text-xs text-[#77736C]">
                    Already registered?{' '}
                    <Link
                      href="/login"
                      className="font-semibold text-[#D6B47A] transition-colors hover:text-[#E0C38E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]/50"
                    >
                      Sign in to your account
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>

          <p className="mt-5 text-center font-mono text-[9px] uppercase tracking-[0.15em] text-[#77736C]/70">
            CtrlPass Organizer Platform
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  type,
  autoComplete,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  icon: typeof User;
  type: string;
  autoComplete: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#A7A39B]"
      >
        {label}
      </label>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736C]" />

        <input
          id={id}
          type={type}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-white/[0.08] bg-[#111111] py-3.5 pl-10 pr-4 text-sm text-[#F5F5F2] outline-none transition-colors placeholder:text-[#77736C] hover:border-white/[0.12] focus:border-[#D6B47A]/40 focus:ring-2 focus:ring-[#D6B47A]/10"
        />
      </div>
    </div>
  );
}