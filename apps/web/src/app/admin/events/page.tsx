'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { eventService } from '@/services/events';
import type { Event } from '@ctrlpass/types';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

type StatusFilter = 'all' | 'published' | 'draft' | 'completed' | 'cancelled';

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

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeStatus(status: string) {
  return status.toLowerCase();
}

function MetricCard({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: number;
  icon: typeof CalendarDays;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#F5F5F2]">
            {value.toLocaleString('en-IN')}
          </p>
          <p className="mt-1.5 text-xs text-[#77736C]">{description}</p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#D6B47A]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: Event }) {
  const status = normalizeStatus(event.status);

  return (
    <div className="group border-b border-white/[0.05] px-5 py-5 last:border-0">
      <div className="grid gap-5 lg:grid-cols-[minmax(260px,1.5fr)_150px_180px_150px_110px] lg:items-center">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111]">
              <CalendarDays className="h-4 w-4 text-[#D6B47A]" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#F5F5F2]">
                {event.name}
              </p>

              <p className="mt-1 truncate text-[11px] text-[#77736C]">
                {event.slug}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-[#77736C] lg:hidden">
            Category
          </p>
          <p className="text-xs text-[#A7A39B]">
            {event.category || 'General'}
          </p>
        </div>

        <div>
          <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-[#77736C] lg:hidden">
            Organizer
          </p>
          <p className="truncate text-xs text-[#A7A39B]">
            {event.organizer?.name || '—'}
          </p>
        </div>

        <div>
          <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-[#77736C] lg:hidden">
            Schedule
          </p>
          <p className="text-xs text-[#A7A39B]">
            {formatDate(event.start_at)}
          </p>
          <p className="mt-1 text-[10px] text-[#77736C]">
            {event.venue?.name || event.venue?.city || 'Venue not specified'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <StatusBadge status={event.status} />

          <Link
            href={`/admin/event-review?event=${event.id}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-[#111111] text-[#77736C] transition hover:border-[#D6B47A]/30 hover:text-[#D6B47A]"
            title="Inspect event"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {status === 'published' && (
        <div className="mt-4 flex items-center gap-2 pl-12 text-[10px] text-[#7FBF9A]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Publicly listed
        </div>
      )}

      {status === 'draft' && (
        <div className="mt-4 flex items-center gap-2 pl-12 text-[10px] text-[#D6B47A]">
          <FileText className="h-3.5 w-3.5" />
          Awaiting publication
        </div>
      )}

      {event.published_at && (
        <p className="mt-2 pl-12 text-[10px] text-[#77736C]">
          Published {formatDateTime(event.published_at)}
        </p>
      )}
    </div>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadEvents() {
      try {
        setLoading(true);
        setError(null);

        const data = await eventService.listAllEventsForAdmin();

        if (mounted) {
          setEvents(data);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load platform events.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadEvents();

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    return {
      total: events.length,
      published: events.filter(
        (event) => normalizeStatus(event.status) === 'published',
      ).length,
      drafts: events.filter(
        (event) => normalizeStatus(event.status) === 'draft',
      ).length,
      completed: events.filter(
        (event) => normalizeStatus(event.status) === 'completed',
      ).length,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !query ||
        event.name.toLowerCase().includes(query) ||
        event.slug.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query) ||
        event.organizer?.name?.toLowerCase().includes(query);

      const matchesStatus =
        status === 'all' || normalizeStatus(event.status) === status;

      return matchesSearch && matchesStatus;
    });
  }, [events, search, status]);

  return (
    <DashboardLayout
      role="admin"
      title="Event Directory"
      subtitle="Platform-wide event inventory, publishing state, organizers, and schedules."
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Events"
            value={metrics.total}
            description="All platform events"
            icon={CalendarDays}
          />

          <MetricCard
            label="Published"
            value={metrics.published}
            description="Currently public"
            icon={CheckCircle2}
          />

          <MetricCard
            label="Drafts"
            value={metrics.drafts}
            description="Not yet published"
            icon={FileText}
          />

          <MetricCard
            label="Completed"
            value={metrics.completed}
            description="Past event lifecycle"
            icon={Clock3}
          />
        </section>

        <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b]">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#D6B47A]" />
                <h2 className="text-sm font-semibold text-[#F5F5F2]">
                  Platform Events
                </h2>
              </div>

              <p className="mt-1 text-xs text-[#77736C]">
                Search and inspect events created across CtrlPass.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 sm:w-72">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736C]" />
                <input
                  type="text"
                  placeholder="Search events, organizers..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#080808] pl-10 pr-4 text-xs text-[#F5F5F2] outline-none transition placeholder:text-[#55524D] focus:border-[#D6B47A]/40"
                />
              </div>

              <div className="relative">
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#77736C]" />
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as StatusFilter)
                  }
                  className="h-10 appearance-none rounded-xl border border-white/[0.08] bg-[#080808] pl-9 pr-9 text-xs text-[#A7A39B] outline-none transition focus:border-[#D6B47A]/40"
                >
                  <option value="all">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#D6B47A]/20 bg-[#D6B47A]/10">
                <CalendarDays className="h-4 w-4 animate-pulse text-[#D6B47A]" />
              </div>

              <p className="mt-4 text-sm font-medium text-[#F5F5F2]">
                Loading events
              </p>

              <p className="mt-1 text-xs text-[#77736C]">
                Fetching the live platform catalog...
              </p>
            </div>
          ) : error ? (
            <div className="px-6 py-14 text-center">
              <ShieldAlert className="mx-auto h-6 w-6 text-[#D96B6B]" />
              <p className="mt-3 text-sm font-medium text-[#F5F5F2]">
                Unable to load events
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#77736C]">
                {error}
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <CalendarDays className="mx-auto h-6 w-6 text-[#77736C]" />

              <p className="mt-3 text-sm font-medium text-[#F5F5F2]">
                {events.length === 0
                  ? 'No events recorded'
                  : 'No matching events'}
              </p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#77736C]">
                {events.length === 0
                  ? 'Events created across the platform will appear here.'
                  : 'Try changing the search term or status filter.'}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(260px,1.5fr)_150px_180px_150px_110px] gap-5 border-b border-white/[0.06] px-5 py-3 lg:grid">
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                  Event
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                  Category
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                  Organizer
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                  Schedule
                </span>
                <span className="text-right text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                  State
                </span>
              </div>

              <div>
                {filteredEvents.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>

              <div className="border-t border-white/[0.06] px-5 py-3">
                <p className="text-[11px] text-[#77736C]">
                  Showing{' '}
                  <span className="text-[#A7A39B]">
                    {filteredEvents.length.toLocaleString('en-IN')}
                  </span>{' '}
                  of{' '}
                  <span className="text-[#A7A39B]">
                    {events.length.toLocaleString('en-IN')}
                  </span>{' '}
                  events
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}