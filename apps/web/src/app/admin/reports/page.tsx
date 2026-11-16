'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { adminService } from '@/services/admin';
import {
  BarChart3,
  CheckCircle2,
  IndianRupee,
  RefreshCw,
  Ticket,
  TrendingUp,
  Users,
  Activity,
} from 'lucide-react';

type ReportMetrics = {
  conversionRate: number | null;
  attendanceRate: number | null;
  confirmedBookings: number;
  issuedTickets: number;
  successfulCheckins: number;
  totalRevenuePaise: number;
};

const initialMetrics: ReportMetrics = {
  conversionRate: null,
  attendanceRate: null,
  confirmedBookings: 0,
  issuedTickets: 0,
  successfulCheckins: 0,
  totalRevenuePaise: 0,
};

function formatCurrency(value: number) {
  return `₹${(value / 100).toLocaleString('en-IN')}`;
}

function formatPercentage(value: number | null) {
  return value === null ? 'N/A' : `${value.toFixed(1)}%`;
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
  icon: typeof TrendingUp;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
            {label}
          </p>

          <p
            className={`mt-3 truncate text-2xl font-semibold tracking-tight ${
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

function ProgressMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: number | null;
  description: string;
}) {
  const percentage = value === null ? 0 : Math.max(0, Math.min(100, value));

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
            {label}
          </p>

          <p className="mt-2 text-xl font-semibold text-[#F5F5F2]">
            {formatPercentage(value)}
          </p>
        </div>

        <BarChart3 className="h-4 w-4 text-[#D6B47A]" />
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#181818]">
        <div
          className="h-full rounded-full bg-[#D6B47A] transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[#77736C]">
        {description}
      </p>
    </div>
  );
}

export default function AdminReportsPage() {
  const [metrics, setMetrics] = useState<ReportMetrics>(initialMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMetrics() {
    try {
      setLoading(true);
      setError(null);

      const data = await adminService.getReportMetrics();
      setMetrics(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load platform metrics.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMetrics();
  }, []);

  const summary = useMemo(() => {
    const ticketsPerBooking =
      metrics.confirmedBookings > 0
        ? metrics.issuedTickets / metrics.confirmedBookings
        : 0;

    const checkInCoverage =
      metrics.issuedTickets > 0
        ? (metrics.successfulCheckins / metrics.issuedTickets) * 100
        : null;

    return {
      ticketsPerBooking,
      checkInCoverage,
    };
  }, [metrics]);

  return (
    <DashboardLayout
      role="admin"
      title="Platform Reports"
      subtitle="Live booking, ticket, revenue, conversion, and attendance metrics."
      actions={
        <button
          type="button"
          onClick={() => void loadMetrics()}
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
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-[#D96B6B]/20 bg-[#D96B6B]/5 px-4 py-3 text-xs text-[#D96B6B]">
            <Activity className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-6 py-16 text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#D6B47A]" />

            <p className="mt-4 text-sm font-medium text-[#F5F5F2]">
              Calculating platform metrics
            </p>

            <p className="mt-1 text-xs text-[#77736C]">
              Fetching the latest reporting data...
            </p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Platform Revenue"
                value={formatCurrency(metrics.totalRevenuePaise)}
                description="Total revenue represented by report metrics"
                icon={IndianRupee}
                accent
              />

              <MetricCard
                label="Confirmed Bookings"
                value={metrics.confirmedBookings.toLocaleString('en-IN')}
                description="Successfully confirmed bookings"
                icon={CheckCircle2}
              />

              <MetricCard
                label="Issued Tickets"
                value={metrics.issuedTickets.toLocaleString('en-IN')}
                description={`${summary.ticketsPerBooking.toFixed(1)} tickets per confirmed booking`}
                icon={Ticket}
              />

              <MetricCard
                label="Successful Check-ins"
                value={metrics.successfulCheckins.toLocaleString('en-IN')}
                description="Recorded successful gate check-ins"
                icon={Users}
              />
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ProgressMetric
                label="Booking Conversion"
                value={metrics.conversionRate}
                description="Conversion rate returned by the platform reporting service."
              />

              <ProgressMetric
                label="Attendance Rate"
                value={metrics.attendanceRate}
                description="Attendance rate returned by the platform reporting service."
              />
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#D6B47A]">
                    <TrendingUp className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#77736C]">
                      Check-in Coverage
                    </p>

                    <p className="mt-1 text-lg font-semibold text-[#F5F5F2]">
                      {formatPercentage(summary.checkInCoverage)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-[#77736C]">
                  Successful check-ins compared with issued tickets.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#D6B47A]">
                    <Ticket className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#77736C]">
                      Ticket Density
                    </p>

                    <p className="mt-1 text-lg font-semibold text-[#F5F5F2]">
                      {summary.ticketsPerBooking.toFixed(1)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-[#77736C]">
                  Average issued tickets represented per confirmed booking.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#D6B47A]">
                    <BarChart3 className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#77736C]">
                      Reporting Status
                    </p>

                    <p className="mt-1 text-lg font-semibold text-[#7FBF9A]">
                      Live
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-[#77736C]">
                  Metrics are loaded directly from the admin reporting service.
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}