'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { bookingService } from '@/services/bookings';
import {
  CheckCircle2,
  Clock3,
  IndianRupee,
  Search,
  ShoppingBag,
  Ticket,
} from 'lucide-react';

function formatCurrency(value: number) {
  return `₹${(value / 100).toLocaleString('en-IN')}`;
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
  icon: typeof ShoppingBag;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
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

export default function AdminBookingsPage() {
  const [orders, setOrders] = useState<
  Awaited<ReturnType<typeof bookingService.listOrders>>
>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadBookings() {
      try {
        setLoading(true);
        setError(null);

        const data = await bookingService.listOrders();

        if (mounted) {
          setOrders(data);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load platform bookings.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadBookings();

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const totalValue = orders.reduce(
      (sum, order) => sum + (order.total_amount_minor || 0),
      0,
    );

    const confirmed = orders.filter(
      (order) => order.status.toLowerCase() === 'confirmed',
    ).length;

    const pending = orders.filter((order) => {
      const normalized = order.status.toLowerCase();

      return (
        normalized === 'pending' ||
        normalized === 'reserved' ||
        normalized === 'payment_pending'
      );
    }).length;

    const tickets = orders.reduce(
      (sum, order) => sum + (order.ticket_count || 0),
      0,
    );

    return {
      totalValue,
      confirmed,
      pending,
      tickets,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return orders;
    }

    return orders.filter((order) => {
      return (
        order.booking_reference?.toLowerCase().includes(query) ||
        order.attendee_name?.toLowerCase().includes(query) ||
        order.attendee_email?.toLowerCase().includes(query) ||
        order.event?.name?.toLowerCase().includes(query)
      );
    });
  }, [orders, search]);

  return (
    <DashboardLayout
      role="admin"
      title="Platform Bookings"
      subtitle="Central booking ledger for reservations, payments, attendees, and issued tickets."
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Booking Value"
            value={formatCurrency(metrics.totalValue)}
            description="Recorded order value"
            icon={IndianRupee}
            accent
          />

          <MetricCard
            label="Bookings"
            value={orders.length}
            description="Total recorded orders"
            icon={ShoppingBag}
          />

          <MetricCard
            label="Confirmed"
            value={metrics.confirmed}
            description="Successfully confirmed"
            icon={CheckCircle2}
          />

          <MetricCard
            label="Tickets"
            value={metrics.tickets}
            description="Tickets across orders"
            icon={Ticket}
          />
        </section>

        <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b]">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#D6B47A]" />
                <h2 className="text-sm font-semibold text-[#F5F5F2]">
                  Booking Ledger
                </h2>
              </div>

              <p className="mt-1 text-xs text-[#77736C]">
                Live booking records across all platform events.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736C]" />

              <input
                type="text"
                placeholder="Search reference, attendee, event..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#080808] pl-10 pr-4 text-xs text-[#F5F5F2] outline-none transition placeholder:text-[#55524D] focus:border-[#D6B47A]/40"
              />
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#D6B47A]/20 bg-[#D6B47A]/10">
                <ShoppingBag className="h-4 w-4 animate-pulse text-[#D6B47A]" />
              </div>

              <p className="mt-4 text-sm font-medium text-[#F5F5F2]">
                Loading bookings
              </p>

              <p className="mt-1 text-xs text-[#77736C]">
                Fetching the live booking ledger...
              </p>
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <Clock3 className="mx-auto h-6 w-6 text-[#D96B6B]" />

              <p className="mt-3 text-sm font-medium text-[#F5F5F2]">
                Unable to load bookings
              </p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#77736C]">
                {error}
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <ShoppingBag className="mx-auto h-6 w-6 text-[#77736C]" />

              <p className="mt-3 text-sm font-medium text-[#F5F5F2]">
                {orders.length === 0
                  ? 'No bookings recorded'
                  : 'No matching bookings'}
              </p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#77736C]">
                {orders.length === 0
                  ? 'Bookings created through CtrlPass will appear here.'
                  : 'Try another booking reference, attendee, or event.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Booking
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Event
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Attendee
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Status
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Created
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-white/[0.045] transition hover:bg-white/[0.018]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-mono text-xs font-semibold text-[#D6B47A]">
                            {order.booking_reference}
                          </p>

                          <p className="mt-1 text-[10px] text-[#77736C]">
                            {order.ticket_count || 0} ticket
                            {(order.ticket_count || 0) === 1 ? '' : 's'}
                          </p>
                        </td>

                        <td className="max-w-[220px] px-5 py-4">
                          <p className="truncate text-xs font-medium text-[#F5F5F2]">
                            {order.event?.name || '—'}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs text-[#A7A39B]">
                            {order.attendee_name || '—'}
                          </p>

                          <p className="mt-1 max-w-[190px] truncate text-[10px] text-[#77736C]">
                            {order.attendee_email || '—'}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs font-semibold text-[#F5F5F2]">
                            {formatCurrency(order.total_amount_minor)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={order.status} />
                        </td>

                        <td className="px-5 py-4 text-xs text-[#77736C]">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-white/[0.06] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-[#77736C]">
                  Showing{' '}
                  <span className="text-[#A7A39B]">
                    {filteredOrders.length.toLocaleString('en-IN')}
                  </span>{' '}
                  of{' '}
                  <span className="text-[#A7A39B]">
                    {orders.length.toLocaleString('en-IN')}
                  </span>{' '}
                  bookings
                </p>

                <div className="flex items-center gap-2 text-[10px] text-[#77736C]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#7FBF9A]" />
                  Live booking records
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}