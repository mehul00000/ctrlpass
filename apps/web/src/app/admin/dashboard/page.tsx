'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { adminService } from '@/services/admin';
import { eventService } from '@/services/events';
import type { Event } from '@ctrlpass/types';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  ShoppingBag,
  Users,
} from 'lucide-react';

type DashboardStats = {
  totalRevenuePaise: number;
  totalBookings: number;
  totalEvents: number;
  totalCheckins: number;
  pendingReviews: number;
};

function formatCurrency(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: typeof CircleDollarSign;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
            {label}
          </p>

          <p
            className={`mt-3 text-2xl font-semibold tracking-tight ${
              accent ? 'text-[#D6B47A]' : 'text-[#F5F5F2]'
            }`}
          >
            {value}
          </p>

          <p className="mt-1.5 text-xs text-[#77736C]">{description}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
            accent
              ? 'border-[#D6B47A]/20 bg-[#D6B47A]/10 text-[#D6B47A]'
              : 'border-white/[0.07] bg-[#111111] text-[#A7A39B]'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'warning' | 'neutral';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-[#7FBF9A]'
      : tone === 'warning'
        ? 'text-[#D6B47A]'
        : 'text-[#A7A39B]';

  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-3 last:border-0 last:pb-0">
      <span className="text-xs text-[#A7A39B]">{label}</span>
      <span className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenuePaise: 0,
    totalBookings: 0,
    totalEvents: 0,
    totalCheckins: 0,
    pendingReviews: 0,
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [dashboardStats, eventList] = await Promise.all([
          adminService.getDashboardStats(),
          eventService.listAllEventsForAdmin(),
        ]);

        if (!mounted) {
          return;
        }

        setStats(dashboardStats);
        setEvents(eventList);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Could not load the admin dashboard.',
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const eventSummary = useMemo(() => {
    const published = events.filter(
      (event) => event.status.toLowerCase() === 'published',
    ).length;

    const draft = events.filter(
      (event) => event.status.toLowerCase() === 'draft',
    ).length;

    return {
      published,
      draft,
    };
  }, [events]);

  const recentEvents = useMemo(
    () =>
      [...events]
        .sort(
          (a, b) =>
            new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
        )
        .slice(0, 6),
    [events],
  );

  return (
    <DashboardLayout
      role="admin"
      title="Platform Control"
      subtitle="Monitor events, bookings, compliance, and operational activity across CtrlPass."
      actions={
        <Link
          href="/admin/event-review"
          className="inline-flex items-center gap-2 rounded-xl bg-[#D6B47A] px-4 py-2.5 text-xs font-semibold text-[#080808] transition hover:bg-[#E0C18D]"
        >
          <ShieldCheck className="h-4 w-4" />
          Review Queue
          {stats.pendingReviews > 0 && (
            <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[10px]">
              {stats.pendingReviews}
            </span>
          )}
        </Link>
      }
    >
      {loading ? (
        <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-6 py-12 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#D6B47A]/20 bg-[#D6B47A]/10">
            <Activity className="h-4 w-4 animate-pulse text-[#D6B47A]" />
          </div>
          <p className="mt-4 text-sm font-medium text-[#F5F5F2]">
            Loading platform control center
          </p>
          <p className="mt-1 text-xs text-[#77736C]">
            Fetching live platform activity...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[#D96B6B]/20 bg-[#D96B6B]/5 px-6 py-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#D96B6B]" />
            <div>
              <p className="text-sm font-medium text-[#F5F5F2]">
                Dashboard data could not be loaded
              </p>
              <p className="mt-1 text-xs leading-5 text-[#A7A39B]">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Platform Volume"
              value={formatCurrency(stats.totalRevenuePaise)}
              description="Lifetime processed booking value"
              icon={CircleDollarSign}
              accent
            />

            <MetricCard
              label="Bookings"
              value={stats.totalBookings.toLocaleString('en-IN')}
              description="Recorded platform bookings"
              icon={ShoppingBag}
            />

            <MetricCard
              label="Events"
              value={stats.totalEvents.toLocaleString('en-IN')}
              description={`${eventSummary.published} currently published`}
              icon={CalendarDays}
            />

            <MetricCard
              label="Review Queue"
              value={stats.pendingReviews.toLocaleString('en-IN')}
              description={
                stats.pendingReviews === 0
                  ? 'No pending approvals'
                  : 'Events requiring attention'
              }
              icon={ShieldCheck}
              accent={stats.pendingReviews > 0}
            />
          </section>

          <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
            <div className="min-w-0 rounded-2xl border border-white/[0.07] bg-[#0b0b0b]">
              <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#D6B47A]" />
                    <h2 className="text-sm font-semibold text-[#F5F5F2]">
                      Event Directory
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-[#77736C]">
                    Recent events across the platform.
                  </p>
                </div>

                <Link
                  href="/admin/events"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D6B47A] transition hover:text-[#E0C18D]"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {recentEvents.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <CalendarDays className="mx-auto h-6 w-6 text-[#77736C]" />
                  <p className="mt-3 text-sm text-[#A7A39B]">
                    No events recorded yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                          Event
                        </th>
                        <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                          Organizer
                        </th>
                        <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                          Status
                        </th>
                        <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                          Start
                        </th>
                        <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentEvents.map((event) => (
                        <tr
                          key={event.id}
                          className="border-b border-white/[0.045] transition hover:bg-white/[0.018]"
                        >
                          <td className="px-5 py-4">
                            <div className="max-w-[230px]">
                              <p className="truncate text-sm font-medium text-[#F5F5F2]">
                                {event.name}
                              </p>
                              <p className="mt-1 truncate text-[11px] text-[#77736C]">
                                {event.category}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-xs text-[#A7A39B]">
                            {event.organizer?.name || '—'}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={event.status} />
                          </td>

                          <td className="px-5 py-4 font-mono text-[11px] text-[#77736C]">
                            {formatDate(event.start_at)}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Link
                              href="/admin/event-review"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#111111] px-3 py-1.5 text-[11px] font-semibold text-[#A7A39B] transition hover:border-[#D6B47A]/30 hover:text-[#D6B47A]"
                            >
                              Inspect
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#D6B47A]" />
                  <h2 className="text-sm font-semibold text-[#F5F5F2]">
                    Governance
                  </h2>
                </div>

                <p className="mt-1 text-xs text-[#77736C]">
                  Current platform activity requiring administrative attention.
                </p>

                <div className="mt-4">
                  <StatusRow
                    label="Pending event reviews"
                    value={
                      stats.pendingReviews === 0
                        ? 'CLEAR'
                        : `${stats.pendingReviews} OPEN`
                    }
                    tone={
                      stats.pendingReviews === 0 ? 'success' : 'warning'
                    }
                  />

                  <StatusRow
                    label="Published events"
                    value={String(eventSummary.published)}
                    tone="neutral"
                  />

                  <StatusRow
                    label="Draft events"
                    value={String(eventSummary.draft)}
                    tone="neutral"
                  />

                  <StatusRow
                    label="Recorded check-ins"
                    value={stats.totalCheckins.toLocaleString('en-IN')}
                    tone="neutral"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#D6B47A]/15 bg-[#D6B47A]/[0.035] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6B47A]/20 bg-[#D6B47A]/10">
                    <CheckCircle2 className="h-4 w-4 text-[#D6B47A]" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#F5F5F2]">
                      Platform operations
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#77736C]">
                      Live data surface
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/[0.06] bg-[#080808] p-3">
                    <Users className="h-3.5 w-3.5 text-[#A7A39B]" />
                    <p className="mt-2 text-[10px] uppercase tracking-wider text-[#77736C]">
                      Bookings
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#F5F5F2]">
                      {stats.totalBookings.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-[#080808] p-3">
                    <Clock3 className="h-3.5 w-3.5 text-[#A7A39B]" />
                    <p className="mt-2 text-[10px] uppercase tracking-wider text-[#77736C]">
                      Check-ins
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#F5F5F2]">
                      {stats.totalCheckins.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}