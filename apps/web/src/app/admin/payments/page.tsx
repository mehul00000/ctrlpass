'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import { bookingService } from '@/services/bookings';
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

type OrderRecord = Awaited<
  ReturnType<typeof bookingService.listOrders>
>[number];

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
  icon: typeof CreditCard;
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

          <p className="mt-1.5 text-xs text-[#77736C]">
            {description}
          </p>
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

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const data = await bookingService.listOrders();
      setOrders(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load payment records.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
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
      const status = order.status.toLowerCase();

      return (
        status === 'pending' ||
        status === 'reserved' ||
        status === 'payment_pending'
      );
    }).length;

    return {
      totalValue,
      confirmed,
      pending,
    };
  }, [orders]);

  return (
    <DashboardLayout
      role="admin"
      title="Payment Ledger"
      subtitle="Platform-wide payment records derived from confirmed booking transactions."
      actions={
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D6B47A]/25 bg-[#D6B47A]/10 px-4 py-2.5 text-xs font-semibold text-[#D6B47A] transition hover:bg-[#D6B47A]/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      }
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Platform Volume"
            value={formatCurrency(metrics.totalValue)}
            description="Recorded order value"
            icon={IndianRupee}
            accent
          />

          <MetricCard
            label="Payment Records"
            value={orders.length}
            description="Orders with transaction value"
            icon={CreditCard}
          />

          <MetricCard
            label="Confirmed"
            value={metrics.confirmed}
            description="Confirmed payment orders"
            icon={CheckCircle2}
          />

          <MetricCard
            label="Pending"
            value={metrics.pending}
            description="Orders awaiting completion"
            icon={Clock3}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b0b]">
          <div className="flex flex-col gap-3 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#D6B47A]" />
                <h2 className="text-sm font-semibold text-[#F5F5F2]">
                  Transaction Records
                </h2>
              </div>

              <p className="mt-1 text-xs text-[#77736C]">
                Payment-related values currently exposed through the booking service.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#7FBF9A]/15 bg-[#7FBF9A]/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#7FBF9A]">
              <ShieldCheck className="h-3 w-3" />
              Service Data
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <CreditCard className="mx-auto h-6 w-6 animate-pulse text-[#D6B47A]" />

              <p className="mt-4 text-sm font-medium text-[#F5F5F2]">
                Loading payment records
              </p>

              <p className="mt-1 text-xs text-[#77736C]">
                Fetching live booking transaction data...
              </p>
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <ShieldCheck className="mx-auto h-6 w-6 text-[#D96B6B]" />

              <p className="mt-3 text-sm font-medium text-[#F5F5F2]">
                Unable to load payment records
              </p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#77736C]">
                {error}
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No Payment Records"
                description="Payment-related order records will appear here when transactions are created."
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Transaction Ref
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Customer
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Event
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
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-white/[0.045] transition hover:bg-white/[0.018]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-mono text-xs font-semibold text-[#D6B47A]">
                            {order.booking_reference}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs text-[#F5F5F2]">
                            {order.attendee_name || '—'}
                          </p>

                          <p className="mt-1 max-w-[190px] truncate text-[10px] text-[#77736C]">
                            {order.attendee_email || '—'}
                          </p>
                        </td>

                        <td className="max-w-[220px] px-5 py-4">
                          <p className="truncate text-xs text-[#A7A39B]">
                            {order.event?.name || '—'}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs font-semibold text-[#F5F5F2]">
                            {formatCurrency(order.total_amount_minor)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2 text-xs font-semibold ${
                              order.status.toLowerCase() === 'confirmed'
                                ? 'text-[#7FBF9A]'
                                : 'text-[#A7A39B]'
                            }`}
                          >
                            {order.status.toLowerCase() === 'confirmed' ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Clock3 className="h-3.5 w-3.5" />
                            )}

                            {order.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs text-[#77736C]">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-white/[0.06] px-5 py-3">
                <p className="text-[11px] text-[#77736C]">
                  Showing{' '}
                  <span className="text-[#A7A39B]">
                    {orders.length.toLocaleString('en-IN')}
                  </span>{' '}
                  payment-related records from the booking service.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}