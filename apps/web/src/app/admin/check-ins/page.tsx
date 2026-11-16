'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import { bookingService } from '@/services/bookings';
import {
  CheckCircle2,
  Clock3,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

type CheckInRecord = {
  id: string;
  scanned_at: unknown;
  ticket: {
    ticket_reference?: string;
    ticket_type?: {
      name?: string;
    };
  } | null;
};

function toDate(value: unknown): Date | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: unknown) {
  const date = toDate(value);

  if (!date) {
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
  icon: typeof QrCode;
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

export default function AdminCheckInsPage() {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const data = await bookingService.listCheckIns();

      const normalized: CheckInRecord[] = data.map((item) => {
        const record = item as {
          id: string;
          scanned_at: unknown;
          ticket?: {
            ticket_reference?: string;
            ticket_type?: {
              name?: string;
            };
          };
        };

        return {
          id: record.id,
          scanned_at: record.scanned_at,
          ticket: record.ticket ?? null,
        };
      });

      setCheckIns(normalized);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load platform check-ins.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const latestScan = useMemo(() => {
    if (checkIns.length === 0) {
      return null;
    }

    return checkIns.reduce<CheckInRecord | null>((latest, current) => {
      if (!latest) {
        return current;
      }

      const latestDate = toDate(latest.scanned_at);
      const currentDate = toDate(current.scanned_at);

      if (!currentDate) {
        return latest;
      }

      if (!latestDate || currentDate > latestDate) {
        return current;
      }

      return latest;
    }, null);
  }, [checkIns]);

  return (
    <DashboardLayout
      role="admin"
      title="Platform Check-ins"
      subtitle="Central gate-access ledger for QR ticket verification across all events."
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
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Total Scans"
            value={checkIns.length}
            description="Recorded gate entries"
            icon={QrCode}
            accent
          />

          <MetricCard
            label="Verification"
            value="Live"
            description="Entries sourced from check-in records"
            icon={ShieldCheck}
          />

          <MetricCard
            label="Latest Scan"
            value={latestScan ? formatDate(latestScan.scanned_at) : '—'}
            description={
              latestScan?.ticket?.ticket_reference
                ? `Pass ${latestScan.ticket.ticket_reference}`
                : 'No scan recorded'
            }
            icon={Clock3}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b0b]">
          <div className="flex flex-col gap-3 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-[#D6B47A]" />
                <h2 className="text-sm font-semibold text-[#F5F5F2]">
                  Gate Access Ledger
                </h2>
              </div>

              <p className="mt-1 text-xs text-[#77736C]">
                Recorded QR verification activity across the platform.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#7FBF9A]/15 bg-[#7FBF9A]/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#7FBF9A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7FBF9A]" />
              Live Records
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <QrCode className="mx-auto h-6 w-6 animate-pulse text-[#D6B47A]" />

              <p className="mt-4 text-sm font-medium text-[#F5F5F2]">
                Loading check-ins
              </p>

              <p className="mt-1 text-xs text-[#77736C]">
                Fetching the live gate-access ledger...
              </p>
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <ShieldCheck className="mx-auto h-6 w-6 text-[#D96B6B]" />

              <p className="mt-3 text-sm font-medium text-[#F5F5F2]">
                Unable to load check-ins
              </p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#77736C]">
                {error}
              </p>
            </div>
          ) : checkIns.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No Scans Logged"
                description="Verified ticket entries will appear here once scanners record check-ins."
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Timestamp
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Ticket Pass
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Ticket Tier
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Gate Result
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {checkIns.map((checkIn) => (
                      <tr
                        key={checkIn.id}
                        className="border-b border-white/[0.045] transition hover:bg-white/[0.018]"
                      >
                        <td className="px-5 py-4 text-xs text-[#A7A39B]">
                          {formatDate(checkIn.scanned_at)}
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-semibold text-[#D6B47A]">
                            {checkIn.ticket?.ticket_reference || '—'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs text-[#F5F5F2]">
                          {checkIn.ticket?.ticket_type?.name || '—'}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#7FBF9A]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            VERIFIED ENTRY
                          </span>
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
                    {checkIns.length.toLocaleString('en-IN')}
                  </span>{' '}
                  recorded check-in
                  {checkIns.length === 1 ? '' : 's'}.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}