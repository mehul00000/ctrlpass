"use client";

import { SignIn, SignUp, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { KeyRound } from "lucide-react";

/**
 * Auth screen shell. Renders real Clerk components when keys are configured;
 * otherwise shows precise setup instructions (never a fake sign-in).
 */
export function AuthShell({ mode, redirectUrl }: { mode: "sign-in" | "sign-up"; redirectUrl?: string }) {
  const clerkReady = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const isSignIn = mode === "sign-in";

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-brand/20 blur-[160px]"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="h-14 w-14" />
          <h1 className="mt-4 font-display text-3xl font-bold text-white">
            {isSignIn ? "Welcome back" : "Join CtrlPass"}
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            {isSignIn
              ? "Sign in to sync your list, history and favorites."
              : "Create your account — your world of cinema awaits."}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#2b0008]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          {clerkReady ? <ClerkForm mode={mode} redirectUrl={redirectUrl} /> : <SetupNotice />}
        </div>

        <p className="mt-6 text-center text-sm text-neutral-400">
          {isSignIn ? (
            <>
              New to CtrlPass?{" "}
              <Link href="/sign-up" className="font-semibold text-brand-peach hover:text-white">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/sign-in" className="font-semibold text-brand-peach hover:text-white">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function ClerkForm({ mode, redirectUrl }: { mode: "sign-in" | "sign-up"; redirectUrl?: string }) {
  const target = redirectUrl && redirectUrl.startsWith("/") ? redirectUrl : "/";
  return mode === "sign-in" ? (
    <SignIn
      signUpUrl="/sign-up"
      fallbackRedirectUrl={target}
      appearance={{
        variables: {
          colorPrimary: "#CD1C18",
          colorBackground: "#2b0008",
          colorText: "#ffffff",
          colorInputBackground: "rgba(255,255,255,0.06)",
          colorInputText: "#ffffff",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  ) : (
    <SignUp
      signInUrl="/sign-in"
      fallbackRedirectUrl={target}
      appearance={{
        variables: {
          colorPrimary: "#CD1C18",
          colorBackground: "#2b0008",
          colorText: "#ffffff",
          colorInputBackground: "rgba(255,255,255,0.06)",
          colorInputText: "#ffffff",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  );
}

function SetupNotice() {
  return (
    <div className="text-center">
      <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand/20">
        <KeyRound className="h-6 w-6 text-brand-peach" />
      </span>
      <h2 className="font-display text-lg font-semibold text-white">Authentication not configured yet</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-400">
        CtrlPass uses Clerk for authentication. Add your keys to{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">.env.local</code> to activate
        sign-in — everything else already works:
      </p>
      <ol className="mx-auto mt-4 max-w-sm space-y-2 text-left text-xs leading-relaxed text-neutral-400">
        <li>
          1. Create an app at{" "}
          <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="text-brand-peach underline">
            dashboard.clerk.com
          </a>
        </li>
        <li>
          2. Paste the keys:
          <pre className="mt-1 overflow-x-auto rounded-lg bg-black/40 p-2.5 text-[11px] text-neutral-300">
{`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...`}
          </pre>
        </li>
        <li>3. Restart the dev server — this screen becomes the real Clerk sign-in.</li>
      </ol>
      <p className="mt-4 text-xs text-neutral-500">
        Meanwhile, My List and history are stored locally on this device.
      </p>
    </div>
  );
}
