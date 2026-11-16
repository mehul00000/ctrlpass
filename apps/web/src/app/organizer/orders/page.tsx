'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { bookingService } from '@/services/bookings';
import { Booking } from '@ctrlpass/types';
import {
  Search,
  ShoppingBag,
  CreditCard,
  IndianRupee,
  Users,
  RefreshCw,
} from 'lucide-react';

function formatCurrency(minor: number | null | undefined): string {
  const amount = Number(minor ?? 0) / 100;

  return `₹${amount.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';

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

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
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
    <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#77736C]">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#F5F5F2]">
            {value}
          </p>
          <p className="mt-1 text-xs text-[#77736C]">{detail}</p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6B47A]/15 bg-[#D6B47A]/[0.06] text-[#D6B47A]">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Booking[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    try {
      setLoading(true);

      const data = await bookingService.listOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load organizer orders:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return orders;
    }

    return orders.filter((order) => {
      const reference = order.booking_reference?.toLowerCase() ?? '';
      const attendeeName = order.attendee_name?.toLowerCase() ?? '';
      const attendeeEmail = order.attendee_email?.toLowerCase() ?? '';
      const eventName = order.event?.name?.toLowerCase() ?? '';

      return (
        reference.includes(query) ||
        attendeeName.includes(query) ||
        attendeeEmail.includes(query) ||
        eventName.includes(query)
      );
    });
  }, [orders, search]);

  const totalRevenue = useMemo(
    () =>
      orders.reduce(
        (total, order) => total + Number(order.total_amount_minor ?? 0),
        0
      ),
    [orders]
  );

  const totalTickets = useMemo(
    () =>
      orders.reduce(
        (total, order) => total + Number(order.ticket_count ?? 1),
        0
      ),
    [orders]
  );

  const paidOrders = useMemo(
    () =>
      orders.filter((order) =>
        ['PAID', 'CONFIRMED', 'COMPLETED', 'CAPTURED'].includes(
          String(order.status).toUpperCase()
        )
      ).length,
    [orders]
  );

  return (
    <DashboardLayout
      role="organizer"
      title="Orders"
      subtitle="Monitor attendee bookings, ticket volume, and transaction activity."
    >
      <div className="space-y-8">
        {/* Header actions */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs text-[#77736C]">
              {orders.length} total order{orders.length === 1 ? '' : 's'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0B0B0B] px-4 py-2.5 text-xs font-medium text-[#A7A39B] transition hover:border-[#D6B47A]/30 hover:text-[#F5F5F2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Total Orders"
            value={orders.length.toLocaleString('en-IN')}
            detail="All recorded bookings"
          />

          <MetricCard
            icon={<IndianRupee className="h-4 w-4" />}
            label="Gross Value"
            value={formatCurrency(totalRevenue)}
            detail="Across loaded orders"
          />

          <MetricCard
            icon={<Users className="h-4 w-4" />}
            label="Tickets"
            value={totalTickets.toLocaleString('en-IN')}
            detail="Tickets across orders"
          />

          <MetricCard
            icon={<CreditCard className="h-4 w-4" />}
            label="Confirmed"
            value={paidOrders.toLocaleString('en-IN')}
            detail="Paid / completed orders"
          />
        </div>

        {/* Search */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736C]" />

            <input
              type="text"
              placeholder="Search order reference, attendee, email, or event..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#050505] pl-10 pr-4 text-sm text-[#F5F5F2] outline-none transition placeholder:text-[#55524D] focus:border-[#D6B47A]/40"
            />
          </div>
        </div>

        {/* Orders */}
        {loading ? (
          <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-10">
            <div className="flex items-center justify-center gap-3 text-sm text-[#77736C]">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading orders...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No Orders Found' : 'No Orders Yet'}
            description={
              search
                ? 'No orders matched your search criteria.'
                : 'Bookings created through the attendee experience will appear here.'
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080808]">
            {/* Table heading */}
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-[#F5F5F2]">
                  Booking Ledger
                </h2>
                <p className="mt-1 text-xs text-[#77736C]">
                  {filtered.length} result
                  {filtered.length === 1 ? '' : 's'}
                  {search ? ` for "${search}"` : ''}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-[#050505]">
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                      Order
                    </th>
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                      Event
                    </th>
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                      Customer
                    </th>
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                      Tickets
                    </th>
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                      Status
                    </th>
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                      Created
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.05]">
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      className="group transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-semibold text-[#D6B47A]">
                          {order.booking_reference || '—'}
                        </div>
                        <div className="mt-1 text-[10px] text-[#55524D]">
                          {order.id}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[220px] truncate text-sm font-medium text-[#F5F5F2]">
                          {order.event?.name || 'General Event'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-[#F5F5F2]">
                          {order.attendee_name || 'Guest'}
                        </div>
                        <div className="mt-1 text-xs text-[#77736C]">
                          {order.attendee_email || 'No email'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#111111] px-2 py-1 text-xs font-medium text-[#A7A39B]">
                          {order.ticket_count ?? 1}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-[#F5F5F2]">
                          {formatCurrency(order.total_amount_minor)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs text-[#A7A39B]">
                          {formatDate(order.created_at)}
                        </div>
                        <div className="mt-1 text-[10px] text-[#55524D]">
                          {formatDateTime(order.created_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}