'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Download,
  Search,
  Ticket as TicketIcon,
  Users,
} from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { bookingService } from '@/services/bookings';
import { Ticket } from '@ctrlpass/types';

export default function AttendeesPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await bookingService.listTickets();
        setTickets(data);
      } catch (error) {
        console.error('Failed to load attendees:', error);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return tickets;
    }

    return tickets.filter((ticket) => {
      const reference =
        ticket.ticket_reference?.toLowerCase() ?? '';

      const ticketType =
        ticket.ticket_type?.name?.toLowerCase() ?? '';

      return (
        reference.includes(query) ||
        ticketType.includes(query)
      );
    });
  }, [tickets, search]);

  const checkedInCount = tickets.filter(
    (ticket) => Boolean(ticket.checked_in_at),
  ).length;

  const pendingCheckInCount =
    tickets.length - checkedInCount;

  return (
    <DashboardLayout
      role="organizer"
      title="Attendees"
      subtitle="View registered pass holders and monitor check-in activity across your events."
      actions={
        <button
          type="button"
          onClick={() => {
            console.info('Attendee export requested');
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      }
    >
      <div className="space-y-6">
        {/* OVERVIEW */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            icon={<Users className="h-4 w-4" />}
            label="Registered Attendees"
            value={tickets.length.toLocaleString('en-IN')}
          />

          <MetricCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Checked In"
            value={checkedInCount.toLocaleString('en-IN')}
            valueClass="text-emerald-300"
          />

          <MetricCard
            icon={<Clock3 className="h-4 w-4" />}
            label="Awaiting Arrival"
            value={pendingCheckInCount.toLocaleString('en-IN')}
          />
        </div>

        {/* SEARCH */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#080808] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              Attendee directory
            </p>

            <p className="mt-1 text-xs text-white/35">
              {filtered.length} of {tickets.length} attendee records visible
            </p>
          </div>

          <div className="relative w-full lg:w-[380px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search pass reference or ticket type..."
              className="w-full rounded-xl border border-white/10 bg-[#050505] py-3 pl-10 pr-4 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-[#D6B47A]/50 focus:ring-1 focus:ring-[#D6B47A]/15"
            />
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#080808] p-12">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto mb-5 h-10 w-10 animate-pulse rounded-full border border-[#D6B47A]/30 bg-[#D6B47A]/10" />

              <p className="text-sm font-medium text-white/70">
                Loading attendee records...
              </p>

              <p className="mt-2 text-xs text-white/35">
                Fetching the latest ticket data.
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No Attendees Found"
            description={
              search
                ? 'No attendee records match your search query.'
                : 'As visitors purchase tickets through CtrlPass, their attendee records will appear here.'
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080808]">
            <div className="border-b border-white/[0.07] px-5 py-4">
              <div className="flex items-center gap-2">
                <TicketIcon className="h-4 w-4 text-[#D6B47A]" />

                <p className="text-xs font-semibold text-white/70">
                  Registered passes
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.015]">
                    <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                      Pass Reference
                    </th>

                    <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                      Ticket Type
                    </th>

                    <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                      Status
                    </th>

                    <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                      Check-in
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.05]">
                  {filtered.map((ticket) => {
                    const checkedIn = Boolean(ticket.checked_in_at);

                    return (
                      <tr
                        key={ticket.id}
                        className="transition hover:bg-white/[0.025]"
                      >
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-semibold text-[#D6B47A]">
                            {ticket.ticket_reference}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-xs text-white/55">
                            {ticket.ticket_type?.name ||
                              'General Admission'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={ticket.status} />
                        </td>

                        <td className="px-5 py-4">
                          {checkedIn ? (
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />

                              <span className="text-[11px] font-semibold text-emerald-300">
                                Checked In
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5">
                              <Clock3 className="h-3.5 w-3.5 text-white/30" />

                              <span className="text-[11px] font-semibold text-white/40">
                                Awaiting Arrival
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-white/[0.07] px-5 py-3.5">
              <p className="text-[10px] text-white/25">
                Showing {filtered.length.toLocaleString('en-IN')} attendee
                records from the live ticket dataset.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function MetricCard({
  icon,
  label,
  value,
  valueClass = 'text-white',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#080808] p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#D6B47A]">
          {icon}
        </div>

        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">
          Live
        </span>
      </div>

      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-semibold tracking-tight ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}