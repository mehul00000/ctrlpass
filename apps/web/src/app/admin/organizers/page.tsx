'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { adminService } from '@/services/admin';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';

type OrganizerRecord = {
  id: string;
  name: string;
  email?: string | null;
  type?: string | null;
  verification_status?: string | null;
  status?: string | null;
  city?: string | null;
  created_at: string;
};

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
  value: number;
  description: string;
  icon: typeof Building2;
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
            {value.toLocaleString('en-IN')}
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

function OrganizerCard({ organizer }: { organizer: OrganizerRecord }) {
  const verification = organizer.verification_status || '—';
  const accountStatus = organizer.status || '—';

  return (
    <div className="group border-b border-white/[0.05] px-5 py-5 last:border-0 transition hover:bg-white/[0.012]">
      <div className="grid gap-5 lg:grid-cols-[minmax(280px,1.5fr)_140px_160px_130px_140px] lg:items-center">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#D6B47A]">
              <Building2 className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#F5F5F2]">
                {organizer.name}
              </p>

              <p className="mt-1 truncate text-[11px] text-[#77736C]">
                {organizer.email || 'No email available'}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-[#77736C] lg:hidden">
            Organization
          </p>

          <p className="text-xs text-[#A7A39B]">
            {organizer.type || '—'}
          </p>
        </div>

        <div>
          <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-[#77736C] lg:hidden">
            Verification
          </p>

          <StatusBadge status={verification} />
        </div>

        <div>
          <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-[#77736C] lg:hidden">
            Account
          </p>

          <StatusBadge status={accountStatus} />
        </div>

        <div>
          <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-[#77736C] lg:hidden">
            Registered
          </p>

          <p className="text-xs text-[#A7A39B]">
            {formatDate(organizer.created_at)}
          </p>

          <p className="mt-1 text-[10px] text-[#77736C]">
            {organizer.city || 'India'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrganizersPage() {
  const [organizers, setOrganizers] = useState<OrganizerRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOrganizers() {
      try {
        setLoading(true);
        setError(null);

        const data = await adminService.listOrganizers();

        if (!mounted) {
          return;
        }

        const normalized: OrganizerRecord[] = data.map((item) => {
          const organizer = item as OrganizerRecord;

          return {
            id: organizer.id,
            name: organizer.name,
            email: organizer.email,
            type: organizer.type,
            verification_status: organizer.verification_status,
            status: organizer.status,
            city: organizer.city,
            created_at: organizer.created_at,
          };
        });

        setOrganizers(normalized);
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load organizer records.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadOrganizers();

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const verified = organizers.filter(
      (organizer) =>
        organizer.verification_status?.toLowerCase() === 'verified',
    ).length;

    const active = organizers.filter(
      (organizer) => organizer.status?.toLowerCase() === 'active',
    ).length;

    const pending = organizers.filter(
      (organizer) =>
        organizer.verification_status?.toLowerCase() === 'pending',
    ).length;

    return {
      total: organizers.length,
      verified,
      active,
      pending,
    };
  }, [organizers]);

  const filteredOrganizers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return organizers;
    }

    return organizers.filter((organizer) => {
      return (
        organizer.name.toLowerCase().includes(query) ||
        organizer.email?.toLowerCase().includes(query) ||
        organizer.type?.toLowerCase().includes(query) ||
        organizer.city?.toLowerCase().includes(query)
      );
    });
  }, [organizers, search]);

  return (
    <DashboardLayout
      role="admin"
      title="Organizers & Institutions"
      subtitle="Manage the organizations responsible for creating and operating events on CtrlPass."
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Organizations"
            value={metrics.total}
            description="Registered organizer accounts"
            icon={Building2}
          />

          <MetricCard
            label="Verified"
            value={metrics.verified}
            description="Verification completed"
            icon={ShieldCheck}
            accent
          />

          <MetricCard
            label="Active"
            value={metrics.active}
            description="Currently operational"
            icon={CheckCircle2}
          />

          <MetricCard
            label="Pending"
            value={metrics.pending}
            description="Awaiting verification"
            icon={Clock3}
          />
        </section>

        <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b]">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#D6B47A]" />
                <h2 className="text-sm font-semibold text-[#F5F5F2]">
                  Organization Directory
                </h2>
              </div>

              <p className="mt-1 text-xs text-[#77736C]">
                Live organizer records from the platform.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736C]" />

              <input
                type="text"
                placeholder="Search organizations..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#080808] pl-10 pr-4 text-xs text-[#F5F5F2] outline-none transition placeholder:text-[#55524D] focus:border-[#D6B47A]/40"
              />
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#D6B47A]/20 bg-[#D6B47A]/10">
                <Building2 className="h-4 w-4 animate-pulse text-[#D6B47A]" />
              </div>

              <p className="mt-4 text-sm font-medium text-[#F5F5F2]">
                Loading organizations
              </p>

              <p className="mt-1 text-xs text-[#77736C]">
                Fetching the live organizer directory...
              </p>
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <ShieldCheck className="mx-auto h-6 w-6 text-[#D96B6B]" />

              <p className="mt-3 text-sm font-medium text-[#F5F5F2]">
                Unable to load organizers
              </p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#77736C]">
                {error}
              </p>
            </div>
          ) : filteredOrganizers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users className="mx-auto h-6 w-6 text-[#77736C]" />

              <p className="mt-3 text-sm font-medium text-[#F5F5F2]">
                {organizers.length === 0
                  ? 'No organizers registered'
                  : 'No matching organizations'}
              </p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#77736C]">
                {organizers.length === 0
                  ? 'Organizer accounts will appear here once registered.'
                  : 'Try another organization, email, type, or city.'}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(280px,1.5fr)_140px_160px_130px_140px] gap-5 border-b border-white/[0.06] px-5 py-3 lg:grid">
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                  Organization
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                  Type
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                  Verification
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                  Account
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                  Registered
                </span>
              </div>

              <div>
                {filteredOrganizers.map((organizer) => (
                  <OrganizerCard
                    key={organizer.id}
                    organizer={organizer}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
                <p className="text-[11px] text-[#77736C]">
                  Showing{' '}
                  <span className="text-[#A7A39B]">
                    {filteredOrganizers.length.toLocaleString('en-IN')}
                  </span>{' '}
                  of{' '}
                  <span className="text-[#A7A39B]">
                    {organizers.length.toLocaleString('en-IN')}
                  </span>
                </p>

                <div className="hidden items-center gap-1.5 text-[10px] text-[#77736C] sm:flex">
                  <CalendarDays className="h-3.5 w-3.5" />
                  India-first organizer network
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}