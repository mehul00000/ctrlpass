'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import { bookingService } from '@/services/bookings';
import {
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Clock3,
} from 'lucide-react';

type RefundRecord = Awaited<
  ReturnType<typeof bookingService.listRefunds>
>[number];

function formatCurrency(value: number) {
  return `₹${(value / 100).toLocaleString('en-IN')}`;
}

function formatDate(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return '—';
  }

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
  icon: typeof RotateCcw;
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

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const data = await bookingService.listRefunds();
      setRefunds(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load refund records.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const metrics = useMemo(() => {
    const totalAmount = refunds.reduce(
      (sum, refund) => sum + (refund.amount_minor || 0),
      0,
    );

    const pending = refunds.filter(
      (refund) => refund.status?.toLowerCase() === 'pending',
    ).length;

    const completed = refunds.filter((refund) => {
      const status = refund.status?.toLowerCase();

      return (
        status === 'completed' ||
        status === 'success' ||
        status === 'processed'
      );
    }).length;

    return {
      totalAmount,
      pending,
      completed,
    };
  }, [refunds]);

  return (
    <DashboardLayout
      role="admin"
      title="Refund Management"
      subtitle="Platform-wide refund records and reversal activity exposed by the booking service."
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
            label="Refund Value"
            value={formatCurrency(metrics.totalAmount)}
            description="Total recorded refund value"
            icon={IndianRupee}
            accent
          />

          <MetricCard
            label="Refund Records"
            value={refunds.length}
            description="Recorded refund requests"
            icon={RotateCcw}
          />

          <MetricCard
            label="Pending"
            value={metrics.pending}
            description="Awaiting completion"
            icon={Clock3}
          />

          <MetricCard
            label="Completed"
            value={metrics.completed}
            description="Processed refund records"
            icon={CheckCircle2}
          />
        </section>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-[#D96B6B]/20 bg-[#D96B6B]/5 px-4 py-3 text-xs text-[#D96B6B]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b0b]">
          <div className="flex flex-col gap-3 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-[#D6B47A]" />

                <h2 className="text-sm font-semibold text-[#F5F5F2]">
                  Refund Ledger
                </h2>
              </div>

              <p className="mt-1 text-xs text-[#77736C]">
                Recorded refund activity associated with platform bookings.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.07] bg-[#111111] px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-[#77736C]">
              <ShieldCheck className="h-3 w-3 text-[#D6B47A]" />
              Read-only Ledger
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <RotateCcw className="mx-auto h-6 w-6 animate-pulse text-[#D6B47A]" />

              <p className="mt-4 text-sm font-medium text-[#F5F5F2]">
                Loading refund records
              </p>

              <p className="mt-1 text-xs text-[#77736C]">
                Fetching live refund data...
              </p>
            </div>
          ) : refunds.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No Refund Records"
                description="Refund records will appear here when the booking service exposes processed or pending reversals."
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Refund ID
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Booking
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Status
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Reason
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {refunds.map((refund) => (
                      <tr
                        key={refund.id}
                        className="border-b border-white/[0.045] transition hover:bg-white/[0.018]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-mono text-xs font-semibold text-[#D6B47A]">
                            {refund.id.slice(0, 8)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-mono text-xs text-[#A7A39B]">
                            {refund.booking?.booking_reference || '—'}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs font-semibold text-[#F5F5F2]">
                            {formatCurrency(refund.amount_minor || 0)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#A7A39B]">
                            {refund.status?.toLowerCase() === 'completed' ||
                            refund.status?.toLowerCase() === 'success' ||
                            refund.status?.toLowerCase() === 'processed' ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#7FBF9A]" />
                            ) : (
                              <Clock3 className="h-3.5 w-3.5 text-[#D6B47A]" />
                            )}

                            {refund.status || 'PENDING'}
                          </span>
                        </td>

                        <td className="max-w-[240px] px-5 py-4">
                          <p className="truncate text-xs text-[#A7A39B]">
                            {refund.reason || '—'}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-xs text-[#77736C]">
                          {formatDate(
                            'created_at' in refund
                              ? refund.created_at
                              : undefined,
                          )}
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
                    {refunds.length.toLocaleString('en-IN')}
                  </span>{' '}
                  refund record{refunds.length === 1 ? '' : 's'}.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}