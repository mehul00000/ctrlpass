'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Layers3,
  Search,
  Ticket,
  Users,
} from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { eventService } from '@/services/events';
import { Event, TicketType } from '@ctrlpass/types';

interface TicketTierWithEvent extends TicketType {
  eventName: string;
  eventId: string;
}

function formatPrice(priceMinor: number) {
  if (priceMinor === 0) {
    return 'FREE';
  }

  return `₹${(priceMinor / 100).toLocaleString('en-IN')}`;
}

function getCapacity(tier: TicketType) {
  return tier.quantity ?? tier.capacity ?? null;
}

function getSold(tier: TicketType) {
  return tier.sold_quantity ?? 0;
}

function getReserved(tier: TicketType) {
  return tier.reserved_quantity ?? 0;
}

export default function TicketTypesPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await eventService.listOrganizerEvents();
        setEvents(data);
      } catch (error) {
        console.error('Failed to load ticket types:', error);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const allTiers = useMemo<TicketTierWithEvent[]>(() => {
    return events.flatMap((event) =>
      (event.ticket_types ?? event.ticket_tiers ?? []).map((tier) => ({
        ...tier,
        eventName: event.name,
        eventId: event.id,
      })),
    );
  }, [events]);

  const filteredTiers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return allTiers;
    }

    return allTiers.filter(
      (tier) =>
        tier.name.toLowerCase().includes(query) ||
        tier.eventName.toLowerCase().includes(query),
    );
  }, [allTiers, search]);

  const totalCapacity = allTiers.reduce((total, tier) => {
    return total + (getCapacity(tier) ?? 0);
  }, 0);

  const totalSold = allTiers.reduce((total, tier) => {
    return total + getSold(tier);
  }, 0);

  const totalReserved = allTiers.reduce((total, tier) => {
    return total + getReserved(tier);
  }, 0);

  return (
    <DashboardLayout
      role="organizer"
      title="Ticket Types"
      subtitle="Manage pricing, capacity, and reservation limits across your events."
    >
      {loading ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#080808] p-12">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-5 h-10 w-10 animate-pulse rounded-full border border-[#D6B47A]/30 bg-[#D6B47A]/10" />

            <p className="text-sm font-medium text-white/70">
              Loading ticket inventory...
            </p>

            <p className="mt-2 text-xs text-white/35">
              Fetching your current ticket tiers.
            </p>
          </div>
        </div>
      ) : allTiers.length === 0 ? (
        <EmptyState
          title="No Ticket Tiers Configured"
          description="Ticket tiers are configured per event. Open an event to add General Admission, Early Bird, VIP, or free tickets."
          actionText="View Events"
          actionHref="/organizer/events"
        />
      ) : (
        <div className="space-y-6">
          {/* OVERVIEW */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={<Layers3 className="h-4 w-4" />}
              label="Ticket Tiers"
              value={allTiers.length.toLocaleString('en-IN')}
            />

            <MetricCard
              icon={<Users className="h-4 w-4" />}
              label="Total Capacity"
              value={totalCapacity.toLocaleString('en-IN')}
            />

            <MetricCard
              icon={<Ticket className="h-4 w-4" />}
              label="Tickets Sold"
              value={totalSold.toLocaleString('en-IN')}
            />

            <MetricCard
              icon={<Ticket className="h-4 w-4" />}
              label="Reserved"
              value={totalReserved.toLocaleString('en-IN')}
            />
          </div>

          {/* HEADER */}
          <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#080808] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                Inventory across events
              </p>

              <p className="mt-1 text-xs text-white/35">
                {filteredTiers.length} of {allTiers.length} ticket tiers
                visible
              </p>
            </div>

            <div className="relative w-full lg:w-[320px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tickets or events..."
                className="w-full rounded-xl border border-white/10 bg-[#050505] py-3 pl-10 pr-4 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-[#D6B47A]/50 focus:ring-1 focus:ring-[#D6B47A]/15"
              />
            </div>
          </div>

          {/* TICKET GRID */}
          {filteredTiers.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#080808] p-12 text-center">
              <Search className="mx-auto h-5 w-5 text-white/20" />

              <p className="mt-4 text-sm font-semibold text-white/65">
                No matching ticket tiers
              </p>

              <p className="mt-2 text-xs text-white/30">
                Try another ticket or event name.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredTiers.map((tier) => {
                const capacity = getCapacity(tier);
                const sold = getSold(tier);
                const reserved = getReserved(tier);

                const used = sold + reserved;

                const percentage =
                  capacity && capacity > 0
                    ? Math.min((used / capacity) * 100, 100)
                    : 0;

                return (
                  <article
                    key={`${tier.eventId}-${tier.id}`}
                    className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080808] transition hover:border-[#D6B47A]/20 hover:bg-[#0a0a0a]"
                  >
                    <div className="border-b border-white/[0.07] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Link
                            href={`/organizer/events/${tier.eventId}`}
                            className="group/event inline-flex max-w-full items-center gap-1.5"
                          >
                            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.13em] text-white/35 transition group-hover/event:text-[#D6B47A]">
                              {tier.eventName}
                            </span>

                            <ArrowUpRight className="h-3 w-3 shrink-0 text-white/20 transition group-hover/event:text-[#D6B47A]" />
                          </Link>

                          <h2 className="mt-3 truncate text-base font-semibold text-white">
                            {tier.name}
                          </h2>
                        </div>

                        <StatusBadge status={tier.status} />
                      </div>

                      <div className="mt-5 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">
                            Price
                          </p>

                          <p className="mt-1 text-2xl font-semibold tracking-tight text-[#D6B47A]">
                            {formatPrice(tier.price_minor)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">
                            Capacity
                          </p>

                          <p className="mt-1 text-sm font-semibold text-white/70">
                            {capacity !== null
                              ? capacity.toLocaleString('en-IN')
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="mb-3 flex items-center justify-between text-[10px]">
                        <span className="uppercase tracking-[0.14em] text-white/30">
                          Inventory used
                        </span>

                        <span className="font-mono text-white/45">
                          {Math.round(percentage)}%
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-[#D6B47A] transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="mt-5 grid grid-cols-3 divide-x divide-white/[0.06]">
                        <InventoryStat
                          label="Sold"
                          value={sold.toLocaleString('en-IN')}
                        />

                        <InventoryStat
                          label="Reserved"
                          value={reserved.toLocaleString('en-IN')}
                        />

                        <InventoryStat
                          label="Max / Order"
                          value={
                            tier.max_per_booking ??
                            tier.max_per_order ??
                            '—'
                          }
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
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

      <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function InventoryStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="px-3 first:pl-0 last:pr-0">
      <p className="text-[9px] uppercase tracking-[0.12em] text-white/25">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-white/65">
        {value}
      </p>
    </div>
  );
}