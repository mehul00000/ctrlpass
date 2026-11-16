'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { bookingService } from '@/services/bookings';
import {
  IndianRupee,
  CreditCard,
  ShieldCheck,
  Download,
  RefreshCw,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';

type OrderRecord = Awaited<
  ReturnType<typeof bookingService.listOrders>
>[number];

function formatCurrency(minor: unknown): string {
  const value =
    typeof minor === 'number' && Number.isFinite(minor)
      ? minor
      : 0;

  return `₹${(value / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return '—';
  }

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

          <p className="mt-1 text-xs text-[#77736C]">
            {detail}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6B47A]/15 bg-[#D6B47A]/[0.06] text-[#D6B47A]">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);

      const data = await bookingService.listOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load financial orders:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const confirmedOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          String(order.status).toUpperCase() === 'CONFIRMED'
      ),
    [orders]
  );

  const totalGrossMinor = useMemo(
    () =>
      confirmedOrders.reduce(
        (sum, order) =>
          sum + Number(order.total_amount_minor ?? 0),
        0
      ),
    [confirmedOrders]
  );

  const totalFeesMinor = useMemo(
    () =>
      confirmedOrders.reduce(
        (sum, order) =>
          sum + Number(order.booking_fee_minor ?? 0),
        0
      ),
    [confirmedOrders]
  );

  const totalNetMinor = Math.max(
    0,
    totalGrossMinor - totalFeesMinor
  );

  const confirmedCount = confirmedOrders.length;

  return (
    <DashboardLayout
      role="organizer"
      title="Finance"
      subtitle="Review booking revenue, fees, and transaction activity."
      actions={
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D6B47A]/20 bg-[#D6B47A]/[0.08] px-4 py-2.5 text-xs font-medium text-[#D6B47A] transition hover:border-[#D6B47A]/40 hover:bg-[#D6B47A]/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              loading ? 'animate-spin' : ''
            }`}
          />
          Refresh
        </button>
      }
    >
      <div className="space-y-8">
        {/* Financial overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            icon={<IndianRupee className="h-4 w-4" />}
            label="Gross Sales"
            value={formatCurrency(totalGrossMinor)}
            detail="Confirmed booking value"
          />

          <MetricCard
            icon={<CreditCard className="h-4 w-4" />}
            label="Booking Fees"
            value={formatCurrency(totalFeesMinor)}
            detail="Fees recorded on confirmed orders"
          />

          <MetricCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Net Booking Value"
            value={formatCurrency(totalNetMinor)}
            detail="Gross value less recorded fees"
          />
        </div>

        {/* Payment status */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6B47A]/15 bg-[#D6B47A]/[0.06] text-[#D6B47A]">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-[#F5F5F2]">
                    Payment Records
                  </h2>

                  <p className="mt-1 text-xs text-[#77736C]">
                    Financial figures below are derived from recorded
                    booking orders.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#7FBF9A]" />

              <span className="text-xs font-medium text-[#A7A39B]">
                {confirmedCount.toLocaleString('en-IN')} confirmed
                order{confirmedCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.06] bg-[#050505] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#55524D]">
                Orders
              </p>
              <p className="mt-2 text-lg font-semibold text-[#F5F5F2]">
                {orders.length.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-[#050505] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#55524D]">
                Confirmed
              </p>
              <p className="mt-2 text-lg font-semibold text-[#F5F5F2]">
                {confirmedCount.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-[#050505] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#55524D]">
                Recorded Value
              </p>
              <p className="mt-2 text-lg font-semibold text-[#D6B47A]">
                {formatCurrency(totalGrossMinor)}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#F5F5F2]">
                Transaction History
              </h2>

              <p className="mt-1 text-xs text-[#77736C]">
                Booking-level financial records from the organizer
                order service.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-10">
              <div className="flex items-center justify-center gap-3 text-sm text-[#77736C]">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading financial records...
              </div>
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              title="No Financial Records"
              description="Revenue from ticket bookings will appear here once orders are recorded."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080808]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-[#050505]">
                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                        Transaction
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                        Event
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                        Gross
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                        Fees
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                        Net
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                        Status
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.05]">
                    {orders.map((order) => {
                      const gross = Number(
                        order.total_amount_minor ?? 0
                      );

                      const fees = Number(
                        order.booking_fee_minor ?? 0
                      );

                      const net = Math.max(0, gross - fees);

                      return (
                        <tr
                          key={order.id}
                          className="transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-[#111111] text-[#D6B47A]">
                                <Receipt className="h-3.5 w-3.5" />
                              </div>

                              <div>
                                <div className="font-mono text-xs font-semibold text-[#D6B47A]">
                                  {order.booking_reference || '—'}
                                </div>

                                <div className="mt-1 text-[10px] text-[#55524D]">
                                  {order.id}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="max-w-[200px] truncate text-sm font-medium text-[#F5F5F2]">
                              {order.event?.name ||
                                'General Event'}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm font-semibold text-[#F5F5F2]">
                              {formatCurrency(gross)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm text-[#A7A39B]">
                              {formatCurrency(fees)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm font-semibold text-[#F5F5F2]">
                              {formatCurrency(net)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={order.status} />
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-mono text-xs text-[#77736C]">
                              {formatDate(order.created_at)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Financial note */}
        <div className="flex gap-3 rounded-2xl border border-[#D6B47A]/10 bg-[#D6B47A]/[0.035] p-5">
          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#D6B47A]" />

          <div>
            <p className="text-xs font-semibold text-[#F5F5F2]">
              Settlement information
            </p>

            <p className="mt-1 text-xs leading-5 text-[#77736C]">
              This screen currently reports booking-level revenue and
              recorded booking fees. Actual Cashfree settlement,
              payout, refund, or reconciliation states should only be
              displayed when those records are exposed by the backend.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}