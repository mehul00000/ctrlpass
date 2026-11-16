'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { eventService } from '@/services/events';
import { bookingService } from '@/services/bookings';
import { Event, Booking } from '@ctrlpass/types';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DollarSign,
  MapPin,
  Plus,
  QrCode,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';

type BookingWithEvent = Booking & {
  event_id?: string;
};

const statusStyles: Record<string, string> = {
  CONFIRMED:
    'border-[#7FBF9A]/20 bg-[#7FBF9A]/10 text-[#7FBF9A]',
  PENDING:
    'border-[#D6B47A]/20 bg-[#D6B47A]/10 text-[#D6B47A]',
  CANCELLED:
    'border-[#D96B6B]/20 bg-[#D96B6B]/10 text-[#D96B6B]',
  FAILED:
    'border-[#D96B6B]/20 bg-[#D96B6B]/10 text-[#D96B6B]',
};

function formatCurrency(minor: number) {
  return `₹${(minor / 100).toLocaleString('en-IN')}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getEventImage(event: Event) {
  const candidate = event as Event & {
    image_url?: string | null;
    cover_image_url?: string | null;
    image?: string | null;
  };

  return (
    candidate.cover_image_url ||
    candidate.image_url ||
    candidate.image ||
    null
  );
}

function StatusPill({ status }: { status: string }) {
  const style =
    statusStyles[status] ||
    'border-white/[0.08] bg-white/[0.04] text-[#A7A39B]';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-semibold ${style}`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: typeof DollarSign;
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.07] bg-[#111111] p-5 transition-colors hover:border-white/[0.12]">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6B47A]/15 bg-[#D6B47A]/10 text-[#D6B47A]">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>

        <TrendingUp className="h-4 w-4 text-[#77736C] transition-colors group-hover:text-[#D6B47A]" />
      </div>

      <p className="mt-5 text-[11px] font-medium text-[#77736C]">
        {label}
      </p>

      <p className="mt-1 text-[25px] font-semibold tracking-[-0.035em] text-[#F5F5F2]">
        {value}
      </p>

      <p className="mt-1.5 text-[10px] text-[#77736C]">
        {description}
      </p>
    </div>
  );
}

export default function OrganizerDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [orders, setOrders] = useState<Booking[]>([]);
  const [checkIns, setCheckIns] = useState<
    Array<{ result?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [evData, ordData, checkInData] = await Promise.all([
          eventService.listOrganizerEvents(),
          bookingService.listOrders(),
          bookingService.listCheckIns(),
        ]);

        if (!mounted) return;

        setEvents(evData);
        setOrders(ordData);
        setCheckIns(checkInData);
      } catch (e) {
        if (!mounted) return;

        setError(
          e instanceof Error
            ? e.message
            : 'Could not load organizer dashboard.',
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const confirmedOrders = useMemo(
    () => orders.filter((order) => order.status === 'CONFIRMED'),
    [orders],
  );

  const totalTicketsSold = useMemo(
    () =>
      confirmedOrders.reduce(
        (sum, order) => sum + (order.ticket_count || 1),
        0,
      ),
    [confirmedOrders],
  );

  const totalRevenueMinor = useMemo(
    () =>
      confirmedOrders.reduce(
        (sum, order) => sum + (order.total_amount_minor || 0),
        0,
      ),
    [confirmedOrders],
  );

  const totalAttendees = totalTicketsSold;

  const checkInRate = useMemo(() => {
    if (checkIns.length === 0) return null;

    const successful = checkIns.filter(
      (checkIn) => checkIn.result === 'SUCCESS',
    ).length;

    return Math.round((successful / checkIns.length) * 100);
  }, [checkIns]);

  const upcomingEvents = useMemo(() => {
    const now = Date.now();

    return [...events]
      .filter((event) => new Date(event.start_at).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() -
          new Date(b.start_at).getTime(),
      )
      .slice(0, 4);
  }, [events]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(
              (b as Booking & { created_at?: string }).created_at || 0,
            ).getTime() -
            new Date(
              (a as Booking & { created_at?: string }).created_at || 0,
            ).getTime(),
        )
        .slice(0, 6),
    [orders],
  );

  const eventStatus = useMemo(() => {
    const result = {
      ongoing: 0,
      upcoming: 0,
      completed: 0,
      cancelled: 0,
    };

    events.forEach((event) => {
      const status = String(event.status).toUpperCase();

      if (status === 'ONGOING' || status === 'SALES_OPEN') {
        result.ongoing += 1;
      } else if (
        status === 'COMPLETED'
      ) {
        result.completed += 1;
      } else if (
        status === 'CANCELLED'
      ) {
        result.cancelled += 1;
      } else {
        result.upcoming += 1;
      }
    });

    return result;
  }, [events]);

  const revenueByEvent = useMemo(() => {
    const map = new Map<
      string,
      {
        event: Event;
        revenue: number;
      }
    >();

    const eventMap = new Map(events.map((event) => [event.id, event]));

    confirmedOrders.forEach((order) => {
      const booking = order as BookingWithEvent;

      if (!booking.event_id) return;

      const event = eventMap.get(booking.event_id);

      if (!event) return;

      const current = map.get(event.id);

      map.set(event.id, {
        event,
        revenue:
          (current?.revenue || 0) +
          (order.total_amount_minor || 0),
      });
    });

    return [...map.values()]
      .sort((a, b) => {
        const dateDifference =
          new Date(a.event.start_at).getTime() -
          new Date(b.event.start_at).getTime();

        if (dateDifference !== 0) {
          return dateDifference;
        }

        return b.revenue - a.revenue;
      })
      .slice(-7);
  }, [confirmedOrders, events]);

  const maxRevenue = Math.max(
    ...revenueByEvent.map((item) => item.revenue),
    1,
  );

  return (
    <DashboardLayout
      role="organizer"
      title="Overview"
      subtitle="Your event business at a glance"
      actions={
        <Link
          href="/organizer/events/new"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#D6B47A] px-4 text-[12px] font-semibold text-[#050505] shadow-[0_8px_30px_rgba(214,180,122,0.12)] transition-all hover:-translate-y-0.5 hover:bg-[#E0C28D]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          Create Event
        </Link>
      }
    >
      {loading && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-8">
          <LoadingState message="Loading organizer dashboard..." />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-[#D96B6B]/20 bg-[#D96B6B]/[0.06] p-5">
          <p className="text-[12px] font-medium text-[#D96B6B]">
            Unable to load dashboard
          </p>
          <p className="mt-1 text-[11px] text-[#A7A39B]">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {/* =====================================================
              KPI ROW
          ===================================================== */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Tickets Sold"
              value={totalTicketsSold.toLocaleString('en-IN')}
              description="Confirmed ticket quantity"
              icon={Ticket}
            />

            <MetricCard
              label="Revenue"
              value={formatCurrency(totalRevenueMinor)}
              description="From confirmed bookings"
              icon={DollarSign}
            />

            <MetricCard
              label="Active Events"
              value={events.length}
              description={`${eventStatus.ongoing} ongoing · ${eventStatus.upcoming} upcoming`}
              icon={CalendarDays}
            />

            <MetricCard
              label="Total Attendees"
              value={totalAttendees.toLocaleString('en-IN')}
              description={
                checkInRate !== null
                  ? `${checkInRate}% check-in success`
                  : 'No check-in data yet'
              }
              icon={Users}
            />
          </section>

          {/* =====================================================
              REVENUE + UPCOMING EVENTS
          ===================================================== */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.9fr)]">
            {/* Revenue */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#F5F5F2]">
                    Revenue Overview
                  </h2>
                  <p className="mt-1 text-[10px] text-[#77736C]">
                    Confirmed booking revenue by event
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#181818] px-3 py-2">
                  <DollarSign className="h-3.5 w-3.5 text-[#D6B47A]" />
                  <span className="text-[10px] font-medium text-[#A7A39B]">
                    Live data
                  </span>
                </div>
              </div>

              <div className="mt-7">
                {revenueByEvent.length === 0 ? (
                  <div className="flex min-h-[245px] items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-[#0D0D0D]">
                    <div className="text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#D6B47A]/10 text-[#D6B47A]">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <p className="mt-3 text-[12px] font-medium text-[#A7A39B]">
                        No revenue data yet
                      </p>
                      <p className="mt-1 text-[10px] text-[#77736C]">
                        Confirmed bookings will appear here.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative h-[245px] overflow-hidden rounded-xl border border-white/[0.05] bg-[#0D0D0D] px-3 pt-5">
                      {/* Horizontal grid */}
                      <div className="pointer-events-none absolute inset-x-4 top-7 space-y-[47px]">
                        <div className="border-t border-white/[0.055]" />
                        <div className="border-t border-white/[0.055]" />
                        <div className="border-t border-white/[0.055]" />
                        <div className="border-t border-white/[0.055]" />
                        <div className="border-t border-white/[0.055]" />
                      </div>

                      <div className="relative z-10 flex h-full items-end gap-3 px-3 pb-9 sm:gap-5 sm:px-6">
                        {revenueByEvent.map((item) => {
                          const height = Math.max(
                            8,
                            (item.revenue / maxRevenue) * 155,
                          );

                          return (
                            <div
                              key={item.event.id}
                              className="group flex min-w-0 flex-1 flex-col items-center justify-end"
                            >
                              <div className="mb-2 max-w-full truncate text-[9px] font-medium text-[#77736C] opacity-0 transition-opacity group-hover:opacity-100">
                                {formatCurrency(item.revenue)}
                              </div>

                              <div
                                className="w-full max-w-[54px] rounded-t-md bg-[#D6B47A]/80 transition-all duration-300 group-hover:bg-[#D6B47A]"
                                style={{ height }}
                              />

                              <div className="mt-3 flex w-full justify-center">
                                <span className="max-w-[72px] truncate text-center text-[9px] text-[#77736C]">
                                  {item.event.name}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-[#77736C]">
                          Total confirmed revenue
                        </p>
                        <p className="mt-0.5 text-[17px] font-semibold text-[#F5F5F2]">
                          {formatCurrency(totalRevenueMinor)}
                        </p>
                      </div>

                      <Link
                        href="/organizer/finance"
                        className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#D6B47A] hover:text-[#E0C28D]"
                      >
                        View finance
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Upcoming events */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#F5F5F2]">
                  Upcoming Events
                </h2>

                <Link
                  href="/organizer/events"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D6B47A] hover:text-[#E0C28D]"
                >
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="mt-5 divide-y divide-white/[0.06]">
                {upcomingEvents.length === 0 ? (
                  <div className="py-12 text-center">
                    <CalendarDays className="mx-auto h-6 w-6 text-[#77736C]" />
                    <p className="mt-3 text-[12px] font-medium text-[#A7A39B]">
                      No upcoming events
                    </p>
                    <Link
                      href="/organizer/events/new"
                      className="mt-2 inline-flex text-[10px] font-semibold text-[#D6B47A]"
                    >
                      Create an event
                    </Link>
                  </div>
                ) : (
                  upcomingEvents.map((event) => {
                    const image = getEventImage(event);

                    return (
                      <Link
                        key={event.id}
                        href={`/organizer/events/${event.id}`}
                        className="group flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="h-[58px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-[#181818]">
                          {image ? (
                            <img
                              src={image}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <CalendarDays className="h-5 w-5 text-[#77736C]" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-[12px] font-semibold text-[#F5F5F2] transition-colors group-hover:text-[#D6B47A]">
                            {event.name}
                          </h3>

                          <div className="mt-1.5 flex items-center gap-3 text-[9px] text-[#77736C]">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(event.start_at)}
                            </span>

                            <span className="hidden items-center gap-1 sm:flex">
                              <Clock3 className="h-3 w-3" />
                              {formatTime(event.start_at)}
                            </span>
                          </div>

                          <p className="mt-1 flex items-center gap-1 truncate text-[9px] text-[#77736C]">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {event.venue?.name
                              ? `${event.venue.name}, ${event.venue.city}`
                              : 'Venue TBA'}
                          </p>
                        </div>

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-[#181818] text-[#77736C] transition-colors group-hover:border-[#D6B47A]/20 group-hover:text-[#D6B47A]">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          {/* =====================================================
              BOOKINGS + EVENT STATUS
          ===================================================== */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.9fr)]">
            {/* Recent bookings */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#F5F5F2]">
                    Recent Bookings
                  </h2>
                  <p className="mt-1 text-[10px] text-[#77736C]">
                    Latest attendee transactions
                  </p>
                </div>

                <Link
                  href="/organizer/orders"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D6B47A] hover:text-[#E0C28D]"
                >
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="mt-5">
                  <EmptyState
                    title="No bookings yet"
                    description="Confirmed attendee bookings will appear here."
                    actionText="View Events"
                    actionHref="/organizer/events"
                  />
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[650px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.07]">
                        <th className="px-3 pb-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-[#77736C]">
                          Booking
                        </th>
                        <th className="px-3 pb-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-[#77736C]">
                          Attendee
                        </th>
                        <th className="px-3 pb-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-[#77736C]">
                          Tickets
                        </th>
                        <th className="px-3 pb-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-[#77736C]">
                          Amount
                        </th>
                        <th className="px-3 pb-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-[#77736C]">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-white/[0.05] last:border-0"
                        >
                          <td className="px-3 py-3.5">
                            <p className="text-[10px] font-semibold text-[#F5F5F2]">
                              {order.booking_reference}
                            </p>
                            <p className="mt-0.5 text-[9px] text-[#77736C]">
                              Booking
                            </p>
                          </td>

                          <td className="px-3 py-3.5">
                            <p className="max-w-[150px] truncate text-[10px] text-[#A7A39B]">
                              {order.attendee_name || 'Attendee'}
                            </p>
                          </td>

                          <td className="px-3 py-3.5">
                            <span className="text-[10px] text-[#A7A39B]">
                              {order.ticket_count || 1}
                            </span>
                          </td>

                          <td className="px-3 py-3.5">
                            <span className="text-[10px] font-semibold text-[#F5F5F2]">
                              {formatCurrency(
                                order.total_amount_minor || 0,
                              )}
                            </span>
                          </td>

                          <td className="px-3 py-3.5">
                            <StatusPill status={order.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Event status */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5 sm:p-6">
              <div>
                <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#F5F5F2]">
                  Event Status
                </h2>
                <p className="mt-1 text-[10px] text-[#77736C]">
                  Current event lifecycle distribution
                </p>
              </div>

              {events.length === 0 ? (
                <div className="flex min-h-[280px] items-center justify-center">
                  <div className="text-center">
                    <CalendarDays className="mx-auto h-7 w-7 text-[#77736C]" />
                    <p className="mt-3 text-[12px] font-medium text-[#A7A39B]">
                      No events yet
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <div className="flex items-center justify-center">
                    <div
                      className="relative flex h-[175px] w-[175px] items-center justify-center rounded-full"
                      style={{
                        background: `conic-gradient(
                          #D6B47A 0deg ${eventStatus.ongoing * (360 / events.length)}deg,
                          #B88A45 ${eventStatus.ongoing * (360 / events.length)}deg ${(eventStatus.ongoing + eventStatus.upcoming) * (360 / events.length)}deg,
                          #6E6E6E ${(eventStatus.ongoing + eventStatus.upcoming) * (360 / events.length)}deg ${(eventStatus.ongoing + eventStatus.upcoming + eventStatus.completed) * (360 / events.length)}deg,
                          #353535 ${(eventStatus.ongoing + eventStatus.upcoming + eventStatus.completed) * (360 / events.length)}deg 360deg
                        )`,
                      }}
                    >
                      <div className="flex h-[125px] w-[125px] flex-col items-center justify-center rounded-full border border-white/[0.06] bg-[#111111]">
                        <span className="text-[28px] font-semibold tracking-[-0.04em] text-[#F5F5F2]">
                          {events.length}
                        </span>
                        <span className="mt-0.5 text-[9px] text-[#77736C]">
                          Events
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-7 space-y-3">
                    <StatusRow
                      label="Ongoing"
                      value={eventStatus.ongoing}
                      dot="bg-[#D6B47A]"
                    />

                    <StatusRow
                      label="Upcoming"
                      value={eventStatus.upcoming}
                      dot="bg-[#B88A45]"
                    />

                    <StatusRow
                      label="Completed"
                      value={eventStatus.completed}
                      dot="bg-[#6E6E6E]"
                    />

                    <StatusRow
                      label="Cancelled"
                      value={eventStatus.cancelled}
                      dot="bg-[#353535]"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Small operational footer */}
          <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-5 text-[9px] text-[#77736C] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#7FBF9A]" />
              <span>Dashboard data is sourced from your CtrlPass backend.</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <QrCode className="h-3 w-3" />
                {checkIns.length} check-in records
              </span>

              <span className="flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                {totalAttendees.toLocaleString('en-IN')} tickets
              </span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatusRow({
  label,
  value,
  dot,
}: {
  label: string;
  value: number;
  dot: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-[11px] text-[#A7A39B]">{label}</span>
      </div>

      <span className="text-[11px] font-semibold text-[#F5F5F2]">
        {value}
      </span>
    </div>
  );
}
