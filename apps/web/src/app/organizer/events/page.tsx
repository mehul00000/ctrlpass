'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import EventImage from '@/components/EventImage';
import { LoadingState } from '@/components/ui/LoadingState';
import { eventService } from '@/services/events';
import { Event } from '@ctrlpass/types';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  MapPin,
  Plus,
  Search,
  Ticket,
  XCircle,
} from 'lucide-react';

type Filter =
  | 'all'
  | 'published'
  | 'draft'
  | 'completed'
  | 'cancelled';

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);

        const data = await eventService.listOrganizerEvents();

        setEvents(data);
      } catch (error: unknown) {
        console.error('Failed to load organizer events:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events
      .filter((event) => {
        const status = String(event.status).toLowerCase();

        switch (filter) {
          case 'published':
            return (
              status === 'published' ||
              status === 'sales_open'
            );

          case 'draft':
            return (
              status === 'draft' ||
              status === 'submitted_for_review'
            );

          case 'completed':
            return status === 'completed';

          case 'cancelled':
            return status === 'cancelled';

          default:
            return true;
        }
      })
      .filter((event) => {
        if (!normalizedQuery) {
          return true;
        }

        const searchable = [
          event.name,
          event.category,
          event.description,
          event.short_description,
          event.venue?.name,
          event.venue?.city,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchable.includes(normalizedQuery);
      });
  }, [events, query, filter]);

  const publishedCount = events.filter((event) => {
    const status = String(event.status).toLowerCase();

    return (
      status === 'published' ||
      status === 'sales_open'
    );
  }).length;

  const draftCount = events.filter((event) => {
    const status = String(event.status).toLowerCase();

    return (
      status === 'draft' ||
      status === 'submitted_for_review'
    );
  }).length;

  const completedCount = events.filter(
    (event) =>
      String(event.status).toLowerCase() === 'completed',
  ).length;

  const cancelledCount = events.filter(
    (event) =>
      String(event.status).toLowerCase() === 'cancelled',
  ).length;

  const filterLabel = {
    all: 'All Events',
    published: 'Published',
    draft: 'Drafts',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }[filter];

  return (
    <DashboardLayout
      role="organizer"
      title="Events"
      subtitle="Create, manage and monitor your event portfolio"
      actions={
        <Link
          href="/organizer/events/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D6B47A] px-4 py-2.5 text-sm font-semibold text-[#050505] transition-all hover:bg-[#E3C58F] hover:-translate-y-0.5"
        >
          <Plus
            className="h-4 w-4"
            strokeWidth={2.2}
          />
          Create Event
        </Link>
      }
    >
      <div className="space-y-7">
        {/* Portfolio overview */}
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard
            label="Total events"
            value={events.length}
            icon={<Ticket className="h-4 w-4" />}
          />

          <MetricCard
            label="Published"
            value={publishedCount}
            icon={<CheckCircle2 className="h-4 w-4" />}
            accent="success"
          />

          <MetricCard
            label="Drafts"
            value={draftCount}
            icon={<Clock3 className="h-4 w-4" />}
          />

          <MetricCard
            label="Completed"
            value={completedCount}
            icon={<CalendarDays className="h-4 w-4" />}
          />
        </section>

        {/* Search / filter toolbar */}
        <section className="rounded-2xl border border-white/[0.07] bg-[#080808] p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66635E]"
                strokeWidth={1.8}
              />

              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search by event, category or venue..."
                className="h-12 w-full rounded-xl border border-white/[0.07] bg-[#0D0D0D] pl-11 pr-4 text-sm text-[#F5F5F2] outline-none placeholder:text-[#55524D] transition-colors focus:border-[#D6B47A]/45"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowFilters((value) => !value)
                }
                className="flex h-12 w-full items-center justify-between gap-5 rounded-xl border border-white/[0.07] bg-[#0D0D0D] px-4 text-sm text-[#A7A39B] transition-colors hover:border-white/[0.13] hover:text-[#F5F5F2] sm:w-48"
              >
                <span>{filterLabel}</span>

                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showFilters ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showFilters && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-52 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0D0D0D] p-1.5 shadow-2xl">
                  {(
                    [
                      ['all', 'All Events'],
                      ['published', 'Published'],
                      ['draft', 'Drafts'],
                      ['completed', 'Completed'],
                      ['cancelled', 'Cancelled'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setFilter(value);
                        setShowFilters(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        filter === value
                          ? 'bg-[#D6B47A]/10 text-[#D6B47A]'
                          : 'text-[#A7A39B] hover:bg-white/[0.04] hover:text-[#F5F5F2]'
                      }`}
                    >
                      <span>{label}</span>

                      {filter === value && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#D6B47A]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden h-12 items-center rounded-xl border border-white/[0.07] bg-[#0D0D0D] px-4 text-xs text-[#77736C] sm:flex">
              {filteredEvents.length}{' '}
              {filteredEvents.length === 1
                ? 'event'
                : 'events'}
            </div>
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <LoadingState message="Loading your events..." />
        )}

        {/* Empty portfolio */}
        {!loading && events.length === 0 && (
          <EmptyState
            title="No Events Yet"
            description="Create your first event and start building your ticketed experience."
            actionText="Create Event"
            actionHref="/organizer/events/new"
          />
        )}

        {/* No matching events */}
        {!loading &&
          events.length > 0 &&
          filteredEvents.length === 0 && (
            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-[#080808] px-6 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                <Search
                  className="h-5 w-5 text-[#77736C]"
                  strokeWidth={1.7}
                />
              </div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#77736C]">
                Nothing found
              </p>

              <h3 className="mt-3 text-xl font-semibold tracking-tight text-[#F5F5F2]">
                No matching events
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-[#77736C]">
                Try another search term or change the event
                status filter.
              </p>

              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setFilter('all');
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#D6B47A]/25 bg-[#D6B47A]/[0.06] px-4 py-2.5 text-xs font-semibold text-[#D6B47A] transition-colors hover:bg-[#D6B47A]/[0.1]"
              >
                Clear filters
              </button>
            </section>
          )}

        {/* Event portfolio */}
        {!loading && filteredEvents.length > 0 && (
          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#77736C]">
                  Event portfolio
                </p>

                <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#F5F5F2]">
                  Your events
                </h2>
              </div>

              <span className="text-xs text-[#55524D]">
                {cancelledCount > 0
                  ? `${cancelledCount} cancelled`
                  : 'Live portfolio'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

function MetricCard({
  label,
  value,
  icon,
  accent = 'default',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: 'default' | 'success';
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.07] bg-[#080808] p-4 transition-colors hover:border-white/[0.11]">
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
            accent === 'success'
              ? 'border-[#7FBF9A]/20 bg-[#7FBF9A]/[0.07] text-[#7FBF9A]'
              : 'border-[#D6B47A]/20 bg-[#D6B47A]/[0.06] text-[#D6B47A]'
          }`}
        >
          {icon}
        </div>

        <span className="font-mono text-xl font-semibold text-[#F5F5F2]">
          {value}
        </span>
      </div>

      <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.18em] text-[#77736C]">
        {label}
      </p>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const ticketTypes = event.ticket_types ?? [];

  const totalCapacity = ticketTypes.reduce(
    (sum, ticket) =>
      sum +
      (ticket.capacity ??
        ticket.quantity ??
        0),
    0,
  );

  const soldTickets = ticketTypes.reduce(
    (sum, ticket) =>
      sum + (ticket.sold_quantity ?? 0),
    0,
  );

  const inventoryPercentage =
    totalCapacity > 0
      ? Math.min(
          100,
          Math.round(
            (soldTickets / totalCapacity) * 100,
          ),
        )
      : 0;

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080808] transition-all hover:border-white/[0.13]">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
        {/* Image */}
        <div className="relative min-h-[210px] overflow-hidden bg-[#111111] md:min-h-full">
          <EventImage
            src={event.cover_image_url}
            alt={event.name}
            aspectClassName="h-full min-h-[210px]"
            className="rounded-none transition-transform duration-500 group-hover:scale-[1.025]"
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

          <div className="absolute left-3 top-3">
            <StatusBadge status={event.status} />
          </div>

          {event.category && (
            <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 backdrop-blur-md">
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/75">
                {event.category}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-col">
          <div className="flex-1 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#77736C]">
                  Event
                </p>

                <h2 className="mt-1.5 line-clamp-2 text-xl font-semibold leading-tight tracking-tight text-[#F5F5F2]">
                  {event.name}
                </h2>
              </div>

              <Link
                href={`/organizer/events/${event.id}/edit`}
                aria-label={`Edit ${event.name}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-[#77736C] transition-all hover:border-[#D6B47A]/30 hover:bg-[#D6B47A]/[0.08] hover:text-[#D6B47A]"
              >
                <Edit3
                  className="h-3.5 w-3.5"
                  strokeWidth={1.8}
                />
              </Link>
            </div>

            <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#77736C]">
              {event.short_description ||
                event.description ||
                'No description provided.'}
            </p>

            <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-4">
              <InfoRow
                icon={
                  <CalendarDays className="h-3.5 w-3.5" />
                }
                value={formatEventDate(event.start_at)}
              />

              <InfoRow
                icon={
                  <MapPin className="h-3.5 w-3.5" />
                }
                value={
                  event.venue?.name
                    ? `${event.venue.name}${
                        event.venue.city
                          ? `, ${event.venue.city}`
                          : ''
                      }`
                    : 'Venue TBA'
                }
              />

              <InfoRow
                icon={
                  <Ticket className="h-3.5 w-3.5" />
                }
                value={`${ticketTypes.length} ticket ${
                  ticketTypes.length === 1
                    ? 'type'
                    : 'types'
                } configured`}
              />
            </div>

            {totalCapacity > 0 && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[#55524D]">
                    Ticket inventory
                  </span>

                  <span className="font-mono text-[10px] text-[#77736C]">
                    {soldTickets.toLocaleString('en-IN')} /{' '}
                    {totalCapacity.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-[#D6B47A] transition-all"
                    style={{
                      width: `${inventoryPercentage}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3.5 sm:px-6">
            <Link
              href={`/organizer/events/${event.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A7A39B] transition-colors hover:text-[#F5F5F2]"
            >
              Manage Event

              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                strokeWidth={1.8}
              />
            </Link>

            <Link
              href={`/organizer/events/${event.id}/edit`}
              className="inline-flex items-center rounded-lg border border-[#D6B47A]/25 bg-[#D6B47A]/[0.06] px-3 py-2 text-xs font-semibold text-[#D6B47A] transition-all hover:border-[#D6B47A]/40 hover:bg-[#D6B47A]/[0.11]"
            >
              Edit Event
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoRow({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 text-xs text-[#A7A39B]">
      <span className="shrink-0 text-[#D6B47A]">
        {icon}
      </span>

      <span className="truncate">{value}</span>
    </div>
  );
}

function formatEventDate(
  isoString?: string,
): string {
  if (!isoString) {
    return 'Date TBA';
  }

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return 'Date TBA';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}