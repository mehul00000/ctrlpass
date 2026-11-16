'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import { bookingService } from '@/services/bookings';
import {
  QrCode,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Clock3,
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
  scanner: {
    full_name?: string;
  } | null;
};

function toDate(value: unknown): Date | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTime(value: unknown): string {
  const date = toDate(value);

  if (!date) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function formatDate(value: unknown): string {
  const date = toDate(value);

  if (!date) {
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

export default function CheckInsPage() {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);

      const data = await bookingService.listCheckIns();

      /*
       * The current booking service does not expose a precise
       * TypeScript type for the nested ticket/scanner relations.
       *
       * Normalize only the fields this screen actually consumes.
       */
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
          scanner?: {
            full_name?: string;
          };
        };

        return {
          id: record.id,
          scanned_at: record.scanned_at,
          ticket: record.ticket ?? null,
          scanner: record.scanner ?? null,
        };
      });

      setCheckIns(normalized);
    } catch (error) {
      console.error('Failed to load check-ins:', error);
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

    return checkIns.reduce<CheckInRecord | null>(
      (latest, current) => {
        if (!latest) {
          return current;
        }

        const latestDate = toDate(latest.scanned_at);
        const currentDate = toDate(current.scanned_at);

        if (!currentDate) {
          return latest;
        }

        if (!latestDate) {
          return current;
        }

        return currentDate.getTime() > latestDate.getTime()
          ? current
          : latest;
      },
      null
    );
  }, [checkIns]);

  return (
    <DashboardLayout
      role="organizer"
      title="Check-ins"
      subtitle="Monitor ticket scans and verified gate activity across your events."
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
        {/* Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            icon={<QrCode className="h-4 w-4" />}
            label="Total Scanned"
            value={checkIns.length.toLocaleString('en-IN')}
            detail="Recorded check-in events"
          />

          <MetricCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Verification"
            value="Server-side"
            detail="Check-in records from the service"
          />

          <MetricCard
            icon={<Clock3 className="h-4 w-4" />}
            label="Latest Scan"
            value={
              latestScan
                ? formatTime(latestScan.scanned_at)
                : 'No scans'
            }
            detail={
              latestScan
                ? formatDate(latestScan.scanned_at)
                : 'Awaiting first scan'
            }
          />
        </div>

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-10">
            <div className="flex items-center justify-center gap-3 text-sm text-[#77736C]">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading check-in activity...
            </div>
          </div>
        ) : checkIns.length === 0 ? (
          <EmptyState
            title="Awaiting Gate Scans"
            description="When volunteers scan ticket QR codes using the CtrlPass scanner, recorded check-in activity will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080808]">
            {/* Table header */}
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-[#F5F5F2]">
                  Gate Activity
                </h2>

                <p className="mt-1 text-xs text-[#77736C]">
                  {checkIns.length.toLocaleString('en-IN')}{' '}
                  recorded scan
                  {checkIns.length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#77736C]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7FBF9A]" />
                Live data
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-[#050505]">
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                      Timestamp
                    </th>

                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                      Pass Reference
                    </th>

                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                      Ticket Tier
                    </th>

                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                      Scanner
                    </th>

                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                      Result
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.05]">
                  {checkIns.map((checkIn) => (
                    <tr
                      key={checkIn.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs text-[#A7A39B]">
                          {formatTime(checkIn.scanned_at)}
                        </div>

                        <div className="mt-1 text-[10px] text-[#55524D]">
                          {formatDate(checkIn.scanned_at)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-semibold text-[#D6B47A]">
                          {checkIn.ticket?.ticket_reference || '—'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-[#F5F5F2]">
                          {checkIn.ticket?.ticket_type?.name ||
                            'Standard Pass'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs font-medium text-[#A7A39B]">
                          {checkIn.scanner?.full_name ||
                            'Gate Scanner Desk'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7FBF9A]/10 text-[#7FBF9A]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </span>

                          <div>
                            <div className="text-xs font-semibold text-[#7FBF9A]">
                              Access Granted
                            </div>

                            <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[#55524D]">
                              Verified scan
                            </div>
                          </div>
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