'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';
import AnimatedIcon from './ui/AnimatedIcon';

import BrandMark from './BrandMark';

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);

const navigation = [
  {
    href: '/#discover',
    label: 'Discover Events',
  },
  {
    href: '/organizer/events/new',
    label: 'Host an Event',
  },
  {
    href: '/organizer/dashboard',
    label: 'Organizer Hub',
  },
];

/*
 * Clerk session display — mounted only when Clerk is configured.
 * Signed in: real name + avatar with a sign-out menu.
 * Signed out: the same Sign In / Sign up actions as before.
 */
function ClerkSessionArea({
  onNavigate,
  mobile = false,
}: {
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return null;
  }

  if (!user) {
    return (
      <>
        <Link
          href="/login"
          onClick={onNavigate}
          className={
            mobile
              ? 'flex items-center justify-center rounded-[var(--radius-well)] px-4 py-3 text-sm font-medium text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-ink)]'
              : 'whitespace-nowrap rounded-[var(--radius-well)] px-3 py-2 text-sm font-medium text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-ink)]'
          }
        >
          Sign In
        </Link>

        <Link
          href="/signup"
          onClick={onNavigate}
          className={
            mobile
              ? 'btn-primary min-h-[46px] w-full'
              : 'btn-primary min-h-[44px] px-5 text-sm'
          }
        >
          Sign up
        </Link>
      </>
    );
  }

  const displayName =
    user.fullName ?? user.primaryEmailAddress?.emailAddress ?? 'Account';

  return (
    <div
      className={
        mobile
          ? 'well flex items-center justify-between gap-3 px-4 py-3'
          : 'well flex items-center gap-3 py-1.5 pl-4 pr-1.5'
      }
    >
      <span
        className={
          mobile
            ? 'truncate text-sm font-medium text-[color:var(--color-ink)]'
            : 'max-w-[160px] truncate text-sm font-medium text-[color:var(--color-ink)]'
        }
      >
        {displayName}
      </span>

      <UserButton afterSignOutUrl="/" />
    </div>
  );
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--color-rule)] bg-[color-mix(in_oklab,var(--color-paper)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-[1360px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <BrandMark />

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          {navigation.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="whitespace-nowrap rounded-[var(--radius-well)] px-3 py-2 text-sm font-medium text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-ink)]"
            >
              {label}
            </Link>
          ))}

        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          {clerkEnabled ? (
            <ClerkSessionArea />
          ) : (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap rounded-[var(--radius-well)] px-3 py-2 text-sm font-medium text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-ink)]"
              >
                Sign In
              </Link>

              <Link href="/signup" className="btn-primary min-h-[44px] px-5 text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={
            mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
          }
          className="well flex h-11 w-11 items-center justify-center text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-ink)] md:hidden"
        >
          {mobileMenuOpen ? (
            <AnimatedIcon key="open" icon={X} animation="spin" play="always" size={20} />
          ) : (
            <AnimatedIcon key="closed" icon={Menu} animation="spin" play="always" size={20} />
          )}
        </button>
      </div>

      {/* Mobile navigation — the retracting bar */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)] px-5 pb-5 pt-4 md:hidden"
        >
          <nav
            className="space-y-1"
            aria-label="Mobile navigation"
          >
            {navigation.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={closeMobileMenu}
                className="flex items-center rounded-[var(--radius-well)] px-3 py-3 text-base font-medium text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-ink)]"
              >
                {label}
              </Link>
            ))}

            <Link
              href="/admin/dashboard"
              onClick={closeMobileMenu}
              className="flex items-center rounded-[var(--radius-well)] px-3 py-3 text-base font-medium text-[color:var(--color-ink-2)]"
            >
              Admin Console
            </Link>
          </nav>

          <div className="mt-4 grid gap-2 border-t border-[color:var(--color-rule)] pt-4 sm:grid-cols-2">
            {clerkEnabled ? (
              <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
                <ClerkSessionArea mobile onNavigate={closeMobileMenu} />
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="btn-ghost min-h-[46px] w-full"
                >
                  Sign In
                </Link>

                <Link
                  href="/signup"
                  onClick={closeMobileMenu}
                  className="btn-primary min-h-[46px] w-full"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
