'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  CalendarDays,
  Plus,
  Users,
  UserCheck,
  Tag,
  ShoppingBag,
  QrCode,
  WalletCards,
  Bell,
  Settings,
  ShieldCheck,
  Building2,
  CreditCard,
  RotateCcw,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  Search,
  CircleHelp,
} from 'lucide-react';

import ConfigNotice from './ConfigNotice';
import BrandMark from './BrandMark';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const organizerNav: NavItem[] = [
  {
    name: 'Overview',
    href: '/organizer/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Events',
    href: '/organizer/events',
    icon: CalendarDays,
  },
  {
    name: 'Ticket Types',
    href: '/organizer/ticket-types',
    icon: Tag,
  },
  {
    name: 'Attendees',
    href: '/organizer/attendees',
    icon: Users,
  },
  {
    name: 'Volunteers',
    href: '/organizer/volunteers',
    icon: UserCheck,
  },
  {
    name: 'Bookings',
    href: '/organizer/orders',
    icon: ShoppingBag,
  },
  {
    name: 'Check-ins',
    href: '/organizer/check-ins',
    icon: QrCode,
  },
  {
    name: 'Payments',
    href: '/organizer/finance',
    icon: WalletCards,
  },
  {
    name: 'Notifications',
    href: '/organizer/notifications',
    icon: Bell,
  },
  {
    name: 'Settings',
    href: '/organizer/settings',
    icon: Settings,
  },
];

const adminNav: NavItem[] = [
  {
    name: 'Overview',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Event Review',
    href: '/admin/event-review',
    icon: ShieldCheck,
    badge: 'Queue',
  },
  {
    name: 'All Events',
    href: '/admin/events',
    icon: CalendarDays,
  },
  {
    name: 'Organizers',
    href: '/admin/organizers',
    icon: Building2,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Bookings',
    href: '/admin/bookings',
    icon: ShoppingBag,
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
  },
  {
    name: 'Refunds',
    href: '/admin/refunds',
    icon: RotateCcw,
  },
  {
    name: 'Gate Check-ins',
    href: '/admin/check-ins',
    icon: QrCode,
  },
  {
    name: 'Reports & Analytics',
    href: '/admin/reports',
    icon: BarChart3,
  },
  {
    name: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: FileText,
  },
  {
    name: 'System Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

interface DashboardLayoutProps {
  role: 'organizer' | 'admin';
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function DashboardLayout({
  role,
  title,
  subtitle,
  actions,
  children,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const [accountLabel, setAccountLabel] = useState(
    role === 'admin' ? 'Administrator' : 'Organizer',
  );
  const [accountEmail, setAccountEmail] = useState('');

  const navItems = role === 'admin' ? adminNav : organizerNav;

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;

      if (!user) return;

      setAccountEmail(user.email ?? '');

      const name =
        typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : '';

      if (name) {
        setAccountLabel(name);
      }
    });
  }, []);

  async function handleSignOut() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

    router.push('/login');
  }

  function isActive(item: NavItem) {
    if (item.href === '/organizer/dashboard' || item.href === '/admin/dashboard') {
      return pathname === item.href;
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const initials =
    accountLabel
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || (role === 'admin' ? 'AD' : 'OR');

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F2]">
      {/* =========================================================
          DESKTOP SIDEBAR
      ========================================================= */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[254px] border-r border-white/[0.07] bg-[#080808] lg:flex lg:flex-col">
        {/* Brand */}
        <div className="flex h-[74px] items-center border-b border-white/[0.07] px-6">
          <Link
            href={role === 'admin' ? '/admin/dashboard' : '/organizer/dashboard'}
            className="flex items-center gap-3"
          >
            <BrandMark
              size={34}
              compact
              accentClassName="text-[#D6B47A]"
            />

            <span className="text-[22px] font-semibold tracking-[-0.04em] text-[#F5F5F2]">
              CtrlPass
            </span>
          </Link>
        </div>

        {/* Workspace selector */}
        <div className="px-4 pt-5">
          <button
            type="button"
            onClick={() => setWorkspaceOpen((value) => !value)}
            className="flex w-full items-center justify-between rounded-xl border border-white/[0.09] bg-[#111111] px-3 py-2.5 transition-colors hover:border-white/[0.15] hover:bg-[#151515]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D6B47A]/20 bg-[#D6B47A]/10 text-[#D6B47A]">
                {role === 'admin' ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
              </div>

              <div className="min-w-0 text-left">
                <p className="truncate text-[12px] font-semibold text-[#F5F5F2]">
                  {role === 'admin' ? 'Platform Admin' : 'Organizer'}
                </p>
                <p className="truncate text-[10px] text-[#77736C]">
                  CtrlPass workspace
                </p>
              </div>
            </div>

            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[#77736C] transition-transform ${
                workspaceOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {workspaceOpen && (
            <div className="mt-2 overflow-hidden rounded-xl border border-white/[0.08] bg-[#111111] p-1 shadow-2xl">
              <div className="rounded-lg px-3 py-2.5">
                <p className="text-[11px] font-medium text-[#F5F5F2]">
                  {role === 'admin' ? 'Platform Admin' : 'Organizer'}
                </p>
                <p className="mt-0.5 text-[10px] text-[#77736C]">
                  Current workspace
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-5 flex-1 overflow-y-auto px-3 pb-5">
          <div className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#77736C]">
            Workspace
          </div>

          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'group relative flex h-[42px] items-center justify-between rounded-xl px-3.5',
                    'text-[13px] font-medium transition-all duration-200',
                    active
                      ? 'bg-[#D6B47A]/[0.12] text-[#F5F5F2]'
                      : 'text-[#A7A39B] hover:bg-white/[0.035] hover:text-[#F5F5F2]',
                  ].join(' ')}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[#D6B47A]" />
                  )}

                  <span className="flex items-center gap-3">
                    <Icon
                      className={[
                        'h-[17px] w-[17px] transition-colors',
                        active
                          ? 'text-[#D6B47A]'
                          : 'text-[#77736C] group-hover:text-[#A7A39B]',
                      ].join(' ')}
                      strokeWidth={1.8}
                    />

                    <span>{item.name}</span>
                  </span>

                  {item.badge && (
                    <span className="rounded-md border border-[#D6B47A]/20 bg-[#D6B47A]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#D6B47A]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Support */}
        <div className="px-4 pb-3">
          <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#D6B47A]/10 text-[#D6B47A]">
              <CircleHelp className="h-4 w-4" />
            </div>

            <p className="text-[12px] font-semibold text-[#F5F5F2]">
              Need help?
            </p>

            <p className="mt-1 text-[10px] leading-4 text-[#77736C]">
              Contact CtrlPass support if you need assistance.
            </p>

            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#D6B47A]/20 bg-[#D6B47A]/10 py-2 text-[11px] font-semibold text-[#D6B47A] transition-colors hover:bg-[#D6B47A]/15"
            >
              Get Support
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="border-t border-white/[0.07] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-[#181818] text-[10px] font-semibold text-[#D6B47A]">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-[#F5F5F2]">
                {accountLabel}
              </p>
              <p className="truncate text-[10px] text-[#77736C]">
                {accountEmail || 'CtrlPass account'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg p-2 text-[#77736C] transition-colors hover:bg-white/[0.05] hover:text-[#D96B6B]"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <Link
            href="/"
            className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[#77736C] transition-colors hover:text-[#A7A39B]"
          >
            Public Portal
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </aside>

      {/* =========================================================
          MAIN AREA
      ========================================================= */}
      <div className="min-h-screen lg:pl-[254px]">
        {/* Header */}
        <header className="sticky top-0 z-40 h-[74px] border-b border-white/[0.07] bg-[#080808]/95 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between gap-4 px-5 sm:px-7 xl:px-9">
            {/* Mobile menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#111111] text-[#A7A39B] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search */}
            <div className="relative hidden max-w-[540px] flex-1 md:block">
              <Search className="absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#77736C]" />

              <input
                type="search"
                placeholder="Search events, bookings, attendees..."
                className="h-[44px] w-full rounded-xl border border-white/[0.09] bg-[#111111] pl-11 pr-4 text-[12px] text-[#F5F5F2] outline-none placeholder:text-[#77736C] transition-colors focus:border-[#D6B47A]/30 focus:bg-[#151515]"
              />
            </div>

            {/* Mobile title */}
            <div className="min-w-0 flex-1 md:hidden">
              <p className="truncate text-[15px] font-semibold text-[#F5F5F2]">
                {title}
              </p>
              {subtitle && (
                <p className="truncate text-[10px] text-[#77736C]">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Header actions */}
            <div className="flex shrink-0 items-center gap-2">
              {actions}

              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#A7A39B] transition-colors hover:bg-white/[0.05] hover:text-[#F5F5F2]"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
                <span className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full bg-[#D6B47A]" />
              </button>

              <div className="hidden h-7 w-px bg-white/[0.08] sm:block" />

              <button
                type="button"
                className="hidden items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04] sm:flex"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] bg-[#181818] text-[9px] font-semibold text-[#D6B47A]">
                  {initials}
                </div>

                <div className="hidden min-w-0 xl:block">
                  <p className="max-w-[120px] truncate text-[11px] font-semibold text-[#F5F5F2]">
                    {accountLabel}
                  </p>
                  <p className="text-[9px] text-[#77736C]">
                    {role === 'admin' ? 'Administrator' : 'Organizer'}
                  </p>
                </div>

                <ChevronDown className="h-3.5 w-3.5 text-[#77736C]" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <aside className="relative flex h-full w-[290px] flex-col border-r border-white/[0.08] bg-[#080808] shadow-2xl">
              <div className="flex h-[74px] items-center justify-between border-b border-white/[0.07] px-5">
                <Link
                  href={role === 'admin' ? '/admin/dashboard' : '/organizer/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3"
                >
                  <BrandMark
                    size={32}
                    compact
                    accentClassName="text-[#D6B47A]"
                  />
                  <span className="text-xl font-semibold tracking-[-0.04em]">
                    CtrlPass
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#77736C] hover:bg-white/[0.05] hover:text-[#F5F5F2]"
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-5">
                <div className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#77736C]">
                  Workspace
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const active = isActive(item);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={[
                          'flex h-11 items-center justify-between rounded-xl px-3.5',
                          'text-[13px] font-medium transition-colors',
                          active
                            ? 'bg-[#D6B47A]/[0.12] text-[#F5F5F2]'
                            : 'text-[#A7A39B] hover:bg-white/[0.04] hover:text-[#F5F5F2]',
                        ].join(' ')}
                      >
                        <span className="flex items-center gap-3">
                          <Icon
                            className={
                              active
                                ? 'h-[18px] w-[18px] text-[#D6B47A]'
                                : 'h-[18px] w-[18px] text-[#77736C]'
                            }
                            strokeWidth={1.8}
                          />
                          {item.name}
                        </span>

                        {item.badge && (
                          <span className="rounded-md bg-[#D6B47A]/10 px-1.5 py-0.5 text-[9px] text-[#D6B47A]">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <div className="border-t border-white/[0.07] p-4">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#111111] py-3 text-[12px] font-medium text-[#A7A39B] hover:text-[#F5F5F2]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Page */}
        <main className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-7 sm:py-8 xl:px-9 xl:py-9">
          {!isSupabaseConfigured && <ConfigNotice />}

          {/* Desktop page heading */}
          <div className="mb-7 hidden items-end justify-between gap-6 md:flex">
            <div className="min-w-0">
              <h1 className="text-[27px] font-semibold tracking-[-0.035em] text-[#F5F5F2]">
                {title}
              </h1>

              {subtitle && (
                <p className="mt-1 text-[12px] text-[#77736C]">
                  {subtitle}
                </p>
              )}
            </div>

            {actions && (
              <div className="flex shrink-0 items-center gap-2">
                {actions}
              </div>
            )}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
