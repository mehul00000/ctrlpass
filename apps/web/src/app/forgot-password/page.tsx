'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import BrandMark from '@/components/BrandMark';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

/*
 * Password reset now lives inside the Clerk <SignIn /> component on /login
 * ("Forgot password?" flow). This page exists to keep old links working.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F2]">
      <Navbar />

      <main className="relative flex min-h-[calc(100vh-72px)] items-center justify-center px-5 py-16">
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <BrandMark href={null} size={56} showWordmark={false} variant="app" />
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-[#F5F5F2]">
            Redirecting to sign in…
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#77736C]">
            Password resets are handled by the secure sign-in screen. Use the
            “Forgot password?” link there.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
