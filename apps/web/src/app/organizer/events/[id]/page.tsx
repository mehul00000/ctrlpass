'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { eventService } from '@/services/events';
import { bookingService } from '@/services/bookings';
import { Event, TicketType } from '@ctrlpass/types';
import {
  ArrowLeft,
  ArrowUpRight,
  Ban,
  CalendarDays,
  CheckCircle2,
  CirclePause,
  Edit3,
  ExternalLink,
  MapPin,
  Pause,
  Play,
  QrCode,
  Rocket,
  Send,
  Tag,
  Ticket,
  Users,
  Zap,
} from 'lucide-react';

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [checkIns, setCheckIns] = useState<Awaited<ReturnType<typeof bookingService.listCheckIns>>>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  async function loadEvent() {
    try {
      const [ev, scans] = await Promise.all([
        eventService.getById(eventId),
        bookingService.listCheckIns(eventId),
      ]);

      setEvent(ev);
      setCheckIns(scans);
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  async function cancelEvent() {
    if (!event) return;

    setStatusLoading(true);
    setStatusError(null);

    try {
      await eventService.updateEventStatus(event.id, 'CANCELLED');
      await loadEvent();
    } catch (error) {
      console.error('Cancel failed:', error);
      setStatusError(
        error instanceof Error
          ? error.message
          : 'Could not cancel event.',
      );
    } finally {
      setStatusLoading(false);
    }
  }

  async function transition(
    action: 'submit' | 'publish' | 'open_sales' | 'close_sales',
  ) {
    if (!event) return;

    setStatusLoading(true);
    setStatusError(null);

    try {
      await eventService.transitionEvent(event.id, action);
      await loadEvent();
    } catch (error) {
      console.error('Lifecycle update failed:', error);
      setStatusError(
        error instanceof Error
          ? error.message
          : 'Lifecycle update failed.',
      );
    } finally {
      setStatusLoading(false);
    }
  }

  const canSubmit = event?.status === 'DRAFT';
  const canPublish = event?.status === 'APPROVED';
  const canOpenSales = event?.status === 'PUBLISHED';
  const canCloseSales = event?.status === 'SALES_OPEN';
  const canCancel =
    event &&
    !['CANCELLED', 'COMPLETED'].includes(event.status);

  return (
    <DashboardLayout
      role="organizer"
      title={event ? event.name : 'Event Management'}
      subtitle={
        event
          ? `Manage event operations, tickets and lifecycle`
          : 'Loading event details...'
      }
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/organizer/events"
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0A0A0A] px-3.5 py-2.5 text-xs font-semibold text-[#A7A39B] transition-colors hover:border-white/[0.14] hover:text-[#F5F5F2]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
            Events
          </Link>

          {event && (
            <Link
              href={`/organizer/events/${event.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D6B47A] px-4 py-2.5 text-xs font-semibold text-[#090909] transition-colors hover:bg-[#E3C58F]"
            >
              <Edit3 className="h-4 w-4" strokeWidth={1.9} />
              Edit Event
            </Link>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-white/[0.07] bg-[#080808]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-[#D6B47A]" />
            <p className="text-sm text-[#77736C]">
              Loading event operations...
            </p>
          </div>
        </div>
      ) : !event ? (
        <EmptyState
          title="Event Not Found"
          description="The requested event could not be retrieved from the database."
          actionText="Return to Events"
          actionHref="/organizer/events"
        />
      ) : (
        <div className="space-y-6">
          {/* Event hero */}
          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#080808]">
            <div className="relative h-48 overflow-hidden bg-[#111111] sm:h-56 lg:h-64">
              {event.cover_image_url ? (
                <img
                  src={event.cover_image_url}
                  alt={event.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#111111]">
                  <Ticket className="h-10 w-10 text-white/10" />
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/20 to-transparent" />

              <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={event.status} />

                    <span className="rounded-md border border-white/[0.08] bg-black/40 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#C4C0B8] backdrop-blur-sm">
                      {event.category || 'General'}
                    </span>

                    <span className="rounded-md border border-white/[0.08] bg-black/40 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#C4C0B8] backdrop-blur-sm">
                      {event.format}
                    </span>
                  </div>

                  <h2 className="max-w-3xl text-2xl font-semibold tracking-tight text-[#F5F5F2] sm:text-3xl">
                    {event.name}
                  </h2>
                </div>

                <div className="shrink-0">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#77736C]">
                    Event ID
                  </span>
                  <p className="mt-1 max-w-[220px] truncate font-mono text-xs text-[#A7A39B]">
                    {event.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <InfoItem
                icon={<CalendarDays />}
                label="Schedule"
                value={formatEventDate(event)}
              />

              <InfoItem
                icon={<MapPin />}
                label="Venue"
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

              <InfoItem
                icon={<Users />}
                label="Capacity"
                value={
                  event.capacity
                    ? `${event.capacity.toLocaleString('en-IN')} attendees`
                    : 'Not specified'
                }
              />
            </div>
          </section>

          {/* Overview */}
          <section>
            <SectionHeading
              icon={<ArrowUpRight />}
              title="Event Overview"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetricCard
                icon={<Ticket />}
                label="Ticket Types"
                value={(event.ticket_types ?? []).length.toString()}
                detail="Configured for this event"
              />

              <MetricCard
                icon={<QrCode />}
                label="Gate Check-ins"
                value={checkIns.length.toLocaleString('en-IN')}
                detail="Recorded check-ins"
              />

              <MetricCard
                icon={<Users />}
                label="Visibility"
                value={event.visibility}
                detail={`${event.status.replace(/_/g, ' ')}`}
              />
            </div>
          </section>

          {/* Description */}
          <section className="rounded-xl border border-white/[0.07] bg-[#080808] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                  About the event
                </p>
                <h3 className="mt-1 text-base font-semibold text-[#F5F5F2]">
                  Description
                </h3>
              </div>

              <Link
                href={`/organizer/events/${event.id}/edit`}
                className="text-xs font-medium text-[#D6B47A] hover:text-[#E3C58F]"
              >
                Edit
              </Link>
            </div>

            <p className="max-w-4xl whitespace-pre-line text-sm leading-7 text-[#88857E]">
              {event.description || 'No description provided.'}
            </p>
          </section>

          {/* Ticket inventory */}
          <section>
            <SectionHeading
              icon={<Tag />}
              title="Ticket Types & Inventory"
            />

            {(event.ticket_types ?? []).length === 0 ? (
              <div className="rounded-xl border border-white/[0.07] bg-[#080808] p-10 text-center">
                <Ticket className="mx-auto mb-3 h-7 w-7 text-[#55524D]" />

                <h3 className="text-sm font-semibold text-[#F5F5F2]">
                  No ticket types configured
                </h3>

                <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-[#77736C]">
                  Add ticket types to define pricing, capacity and booking
                  limits for this event.
                </p>

                <Link
                  href={`/organizer/events/${event.id}/edit`}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#D6B47A] px-4 py-2.5 text-xs font-semibold text-[#090909] hover:bg-[#E3C58F]"
                >
                  Configure Tickets
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(event.ticket_types ?? []).map(
                  (tier: TicketType) => (
                    <TicketCard key={tier.id} tier={tier} />
                  ),
                )}
              </div>
            )}
          </section>

          {/* Lifecycle */}
          <section className="rounded-xl border border-white/[0.07] bg-[#080808]">
            <div className="border-b border-white/[0.06] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                    Operations
                  </p>

                  <h3 className="mt-1 text-base font-semibold text-[#F5F5F2]">
                    Event Lifecycle
                  </h3>
                </div>

                <div className="text-xs text-[#77736C]">
                  Current status:{' '}
                  <span className="font-semibold text-[#D6B47A]">
                    {event.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {statusError && (
                <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3">
                  <Ban className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                  <p className="text-xs leading-5 text-red-300">
                    {statusError}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2.5">
                {canSubmit && (
                  <LifecycleButton
                    icon={<Send />}
                    label="Submit for Review"
                    loading={statusLoading}
                    onClick={() => transition('submit')}
                    primary
                  />
                )}

                {canPublish && (
                  <LifecycleButton
                    icon={<Rocket />}
                    label="Publish Event"
                    loading={statusLoading}
                    onClick={() => transition('publish')}
                    primary
                  />
                )}

                {canOpenSales && (
                  <LifecycleButton
                    icon={<Play />}
                    label="Open Sales"
                    loading={statusLoading}
                    onClick={() => transition('open_sales')}
                    primary
                  />
                )}

                {canCloseSales && (
                  <LifecycleButton
                    icon={<Pause />}
                    label="Close Sales"
                    loading={statusLoading}
                    onClick={() => transition('close_sales')}
                  />
                )}

                {canCancel && (
                  <LifecycleButton
                    icon={<Ban />}
                    label="Cancel Event"
                    loading={statusLoading}
                    onClick={() => {
                      if (
                        window.confirm(
                          'Cancel this event? Attendees will be notified.',
                        )
                      ) {
                        cancelEvent();
                      }
                    }}
                    danger
                  />
                )}

                {!canSubmit &&
                  !canPublish &&
                  !canOpenSales &&
                  !canCloseSales &&
                  !canCancel && (
                    <div className="flex items-center gap-2 text-xs text-[#77736C]">
                      <CheckCircle2 className="h-4 w-4 text-[#7FBF9A]" />
                      No lifecycle actions are currently available.
                    </div>
                  )}
              </div>
            </div>
          </section>

          {/* Operational information */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/[0.07] bg-[#080808] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025]">
                  <QrCode className="h-4 w-4 text-[#D6B47A]" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#F5F5F2]">
                    Check-in Operations
                  </h3>
                  <p className="text-xs text-[#77736C]">
                    Gate activity for this event
                  </p>
                </div>
              </div>

              <div className="flex items-end justify-between border-t border-white/[0.06] pt-4">
                <div>
                  <p className="text-2xl font-semibold text-[#F5F5F2]">
                    {checkIns.length.toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1 text-xs text-[#77736C]">
                    total check-ins recorded
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 text-xs text-[#7FBF9A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7FBF9A]" />
                  Online
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-[#080808] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025]">
                  <ExternalLink className="h-4 w-4 text-[#D6B47A]" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#F5F5F2]">
                    Event Settings
                  </h3>
                  <p className="text-xs text-[#77736C]">
                    Configuration and management
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
                <InfoPill label="Format" value={event.format} />
                <InfoPill label="Visibility" value={event.visibility} />
                <InfoPill label="Timezone" value={event.timezone} />
                <InfoPill
                  label="Created"
                  value={formatShortDate(event.created_at)}
                />
              </div>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

function formatEventDate(event: Event): string {
  const date = new Date(event.start_at);

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

function formatShortDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D6B47A]/[0.07] text-[#D6B47A]">
        <span className="h-4 w-4 [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
      </div>

      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#66635E]">
          {label}
        </p>

        <p className="mt-0.5 truncate text-xs font-medium text-[#C4C0B8]">
          {value}
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#080808] p-5">
      <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-[#D6B47A] [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </div>

      <p className="text-[10px] uppercase tracking-[0.14em] text-[#66635E]">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold tracking-tight text-[#F5F5F2]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#77736C]">{detail}</p>
    </div>
  );
}

function TicketCard({ tier }: { tier: TicketType }) {
  const capacity = tier.capacity ?? tier.quantity;
  const sold = tier.sold_quantity ?? 0;
  const reserved = tier.reserved_quantity ?? 0;

  const available =
    capacity !== undefined
      ? Math.max(0, capacity - sold - reserved)
      : null;

  const soldPercent =
    capacity && capacity > 0
      ? Math.min(100, Math.round((sold / capacity) * 100))
      : 0;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#080808] p-5 transition-colors hover:border-white/[0.12]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-[#F5F5F2]">
            {tier.name}
          </h4>

          <p className="mt-1 line-clamp-2 text-xs text-[#77736C]">
            {tier.description || 'No description'}
          </p>
        </div>

        <StatusBadge status={tier.status} />
      </div>

      <div className="my-5 border-t border-white/[0.06]" />

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#66635E]">
            Price
          </p>

          <p className="mt-1 text-xl font-semibold text-[#D6B47A]">
            {tier.price_minor === 0
              ? 'FREE'
              : formatMinor(tier.price_minor, tier.currency)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#66635E]">
            Capacity
          </p>

          <p className="mt-1 text-sm font-medium text-[#C4C0B8]">
            {capacity !== undefined
              ? capacity.toLocaleString('en-IN')
              : 'Unlimited'}
          </p>
        </div>
      </div>

      {capacity !== undefined && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-[10px] text-[#77736C]">
            <span>{sold.toLocaleString('en-IN')} sold</span>
            <span>{available?.toLocaleString('en-IN')} available</span>
          </div>

          <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-[#D6B47A] transition-all"
              style={{ width: `${soldPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[10px] text-[#77736C]">
        <span>
          Max/order:{' '}
          {tier.max_per_order ?? tier.max_per_booking ?? '—'}
        </span>

        <span>{tier.visibility ?? 'VISIBLE'}</span>
      </div>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-[#D6B47A] [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>

      <h3 className="text-base font-semibold text-[#F5F5F2]">
        {title}
      </h3>
    </div>
  );
}

function LifecycleButton({
  icon,
  label,
  loading,
  onClick,
  primary,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  let className =
    'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';

  if (danger) {
    className +=
      ' border border-red-900/40 bg-red-950/20 text-red-300 hover:bg-red-950/40';
  } else if (primary) {
    className +=
      ' bg-[#D6B47A] text-[#090909] hover:bg-[#E3C58F]';
  } else {
    className +=
      ' border border-white/[0.08] bg-white/[0.035] text-[#C4C0B8] hover:border-white/[0.14] hover:text-[#F5F5F2]';
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={className}
    >
      <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      {loading ? 'Updating...' : label}
    </button>
  );
}

function InfoPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <p className="text-[9px] uppercase tracking-[0.13em] text-[#66635E]">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-medium text-[#A7A39B]">
        {value}
      </p>
    </div>
  );
}

function formatMinor(minor: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(minor / 100);
}