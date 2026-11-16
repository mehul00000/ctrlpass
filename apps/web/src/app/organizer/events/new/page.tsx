'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  IndianRupee,
  MapPin,
  Plus,
  Save,
  ShieldCheck,
  Ticket,
  Trash2,
  X,
} from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';
import { eventService } from '@/services/events';
import {
  ticketTypeService,
  CreateTicketTypePayload,
} from '@/services/ticketTypes';

interface DraftTier {
  name: string;
  price: string;
  quantity: string;
  maxPerBooking: string;
}

const EMPTY_TIER: DraftTier = {
  name: '',
  price: '0',
  quantity: '100',
  maxPerBooking: '4',
};

const categories = [
  'Technology',
  'Music',
  'Sports',
  'Arts',
  'Business',
  'Festival',
  'Conference',
  'Nightlife',
  'Comedy',
  'Food',
];

function formatPrice(value: string) {
  const amount = Number.parseFloat(value || '0');

  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Free';
  }

  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function CreateEventPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Technology');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueCity, setVenueCity] = useState('');

  const [tiers, setTiers] = useState<DraftTier[]>([
    { ...EMPTY_TIER, name: 'General Admission' },
  ]);

  function addTier() {
    setTiers((prev) => [
      ...prev,
      {
        ...EMPTY_TIER,
        name: `Ticket Tier ${prev.length + 1}`,
      },
    ]);
  }

  function removeTier(index: number) {
    setTiers((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateTier(
    index: number,
    field: keyof DraftTier,
    value: string,
  ) {
    setTiers((prev) =>
      prev.map((tier, itemIndex) =>
        itemIndex === index
          ? {
              ...tier,
              [field]: value,
            }
          : tier,
      ),
    );
  }

  const totalCapacity = tiers.reduce((total, tier) => {
    const quantity = Number.parseInt(tier.quantity || '0', 10);

    return total + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);

  const paidTiers = tiers.filter(
    (tier) => Number.parseFloat(tier.price || '0') > 0,
  ).length;

  const freeTiers = tiers.filter(
    (tier) => Number.parseFloat(tier.price || '0') <= 0,
  ).length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedVenueName = venueName.trim();
    const trimmedVenueCity = venueCity.trim();

    if (!trimmedName) {
      setError('Enter an event title.');
      return;
    }

    if (!startAt || !endAt) {
      setError('Select both the event start and end time.');
      return;
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      setError('Enter valid event dates and times.');
      return;
    }

    if (endDate <= startDate) {
      setError('Event end time must be after the start time.');
      return;
    }

    const validTiers = tiers.filter((tier) => tier.name.trim());

    if (validTiers.length === 0) {
      setError('Add at least one ticket tier with a name.');
      return;
    }

    for (const tier of validTiers) {
      const price = Number.parseFloat(tier.price || '0');
      const quantity = Number.parseInt(tier.quantity || '0', 10);
      const maxPerBooking = Number.parseInt(
        tier.maxPerBooking || '0',
        10,
      );

      if (!Number.isFinite(price) || price < 0) {
        setError(`Enter a valid price for "${tier.name}".`);
        return;
      }

      if (!Number.isFinite(quantity) || quantity < 1) {
        setError(`Enter a valid capacity for "${tier.name}".`);
        return;
      }

      if (
        !Number.isFinite(maxPerBooking) ||
        maxPerBooking < 1 ||
        maxPerBooking > 10
      ) {
        setError(
          `Maximum tickets per order for "${tier.name}" must be between 1 and 10.`,
        );
        return;
      }
    }

    setLoading(true);

    try {
      const event = await eventService.createEvent({
        name: trimmedName,
        category,
        description: trimmedDescription,
        venue_name: trimmedVenueName,
        venue_city: trimmedVenueCity,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        status: 'DRAFT',
      });

      await Promise.all(
        validTiers.map((tier) => {
          const payload: CreateTicketTypePayload = {
            event_id: event.id,
            name: tier.name.trim(),
            price_minor: Math.round(
              Number.parseFloat(tier.price || '0') * 100,
            ),
            quantity: Number.parseInt(tier.quantity || '100', 10),
            max_per_booking: Number.parseInt(
              tier.maxPerBooking || '4',
              10,
            ),
          };

          return ticketTypeService.create(payload);
        }),
      );

      setCreated(true);

      window.setTimeout(() => {
        router.push('/organizer/events');
      }, 700);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to create event in database.';

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout
      role="organizer"
      title="Create Event"
      subtitle="Build a new event and configure its ticket inventory."
      actions={
        <Link
          href="/organizer/events"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/75 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-7xl">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />

            <div className="min-w-0">
              <p className="text-sm font-semibold text-rose-200">
                Event could not be created
              </p>
              <p className="mt-1 text-xs leading-5 text-rose-200/60">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto rounded-lg p-1 text-rose-200/50 transition hover:bg-white/5 hover:text-rose-200"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {created && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-4 w-4 text-emerald-300" />
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-200">
                Event created successfully
              </p>
              <p className="mt-1 text-xs text-emerald-200/50">
                Redirecting to your events workspace...
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              {/* BASIC INFORMATION */}
              <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080808]">
                <div className="border-b border-white/[0.07] px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D6B47A]/20 bg-[#D6B47A]/10">
                      <Ticket className="h-4 w-4 text-[#D6B47A]" />
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        Event information
                      </h2>
                      <p className="mt-1 text-xs text-white/35">
                        Define the core details attendees will see.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  <div>
                    <label
                      htmlFor="event-name"
                      className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45"
                    >
                      Event title
                    </label>

                    <input
                      id="event-name"
                      type="text"
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="e.g. CTRL+HACK 2026 National Hackathon"
                      className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#D6B47A]/60 focus:ring-1 focus:ring-[#D6B47A]/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="event-category"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45"
                      >
                        Category
                      </label>

                      <select
                        id="event-category"
                        value={category}
                        onChange={(event) =>
                          setCategory(event.target.value)
                        }
                        className="w-full appearance-none rounded-xl border border-white/10 bg-[#050505] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#D6B47A]/60 focus:ring-1 focus:ring-[#D6B47A]/20"
                      >
                        {categories.map((item) => (
                          <option
                            key={item}
                            value={item}
                            className="bg-[#080808]"
                          >
                            {item === 'Food' ? 'Food & Drink' : item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="event-status"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45"
                      >
                        Initial status
                      </label>

                      <div className="flex min-h-[50px] items-center rounded-xl border border-white/[0.07] bg-white/[0.02] px-4">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#D6B47A]" />
                          <span className="text-sm text-white/55">
                            Draft
                          </span>
                        </div>

                        <span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-white/25">
                          Review required
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="event-description"
                        className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45"
                      >
                        Description
                      </label>

                      <span className="text-[10px] tabular-nums text-white/25">
                        {description.length} characters
                      </span>
                    </div>

                    <textarea
                      id="event-description"
                      rows={7}
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      placeholder="Describe the event, highlights, rules, guest information and what attendees should expect..."
                      className="w-full resize-none rounded-xl border border-white/10 bg-[#050505] px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-[#D6B47A]/60 focus:ring-1 focus:ring-[#D6B47A]/20"
                    />
                  </div>
                </div>
              </section>

              {/* SCHEDULE */}
              <section className="rounded-2xl border border-white/[0.08] bg-[#080808]">
                <div className="border-b border-white/[0.07] px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                      <CalendarDays className="h-4 w-4 text-[#D6B47A]" />
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        Schedule & venue
                      </h2>
                      <p className="mt-1 text-xs text-white/35">
                        Set when and where the event takes place.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="start-at"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45"
                      >
                        Start date & time
                      </label>

                      <input
                        id="start-at"
                        type="datetime-local"
                        required
                        value={startAt}
                        onChange={(event) =>
                          setStartAt(event.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#D6B47A]/60 focus:ring-1 focus:ring-[#D6B47A]/20"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="end-at"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45"
                      >
                        End date & time
                      </label>

                      <input
                        id="end-at"
                        type="datetime-local"
                        required
                        value={endAt}
                        onChange={(event) =>
                          setEndAt(event.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#D6B47A]/60 focus:ring-1 focus:ring-[#D6B47A]/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="venue-name"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45"
                      >
                        Venue
                      </label>

                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                        <input
                          id="venue-name"
                          type="text"
                          value={venueName}
                          onChange={(event) =>
                            setVenueName(event.target.value)
                          }
                          placeholder="e.g. KTPO Convention Center"
                          className="w-full rounded-xl border border-white/10 bg-[#050505] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#D6B47A]/60 focus:ring-1 focus:ring-[#D6B47A]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="venue-city"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45"
                      >
                        City / location
                      </label>

                      <input
                        id="venue-city"
                        type="text"
                        value={venueCity}
                        onChange={(event) =>
                          setVenueCity(event.target.value)
                        }
                        placeholder="e.g. Whitefield, Bengaluru"
                        className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#D6B47A]/60 focus:ring-1 focus:ring-[#D6B47A]/20"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* TICKETS */}
              <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080808]">
                <div className="flex flex-col gap-4 border-b border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D6B47A]/20 bg-[#D6B47A]/10">
                      <IndianRupee className="h-4 w-4 text-[#D6B47A]" />
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        Ticket inventory
                      </h2>
                      <p className="mt-1 text-xs text-white/35">
                        Configure ticket tiers, pricing and purchase limits.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addTier}
                    className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#D6B47A]/20 bg-[#D6B47A]/10 px-3.5 py-2 text-xs font-semibold text-[#D6B47A] transition hover:border-[#D6B47A]/35 hover:bg-[#D6B47A]/15"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Tier
                  </button>
                </div>

                <div className="space-y-4 p-6">
                  {tiers.map((tier, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/[0.08] bg-[#050505] p-5"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05] font-mono text-[10px] text-white/50">
                            {String(index + 1).padStart(2, '0')}
                          </span>

                          <div>
                            <p className="text-xs font-semibold text-white/75">
                              Ticket tier
                            </p>
                            <p className="mt-0.5 text-[10px] text-white/25">
                              Configure inventory and purchase rules
                            </p>
                          </div>
                        </div>

                        {tiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTier(index)}
                            className="rounded-lg border border-rose-500/10 p-2 text-rose-300/60 transition hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-300"
                            title="Remove ticket tier"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="xl:col-span-2">
                          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                            Tier name
                          </label>

                          <input
                            type="text"
                            value={tier.name}
                            onChange={(event) =>
                              updateTier(
                                index,
                                'name',
                                event.target.value,
                              )
                            }
                            placeholder="General Admission, VIP, Early Bird"
                            className="w-full rounded-xl border border-white/10 bg-[#080808] px-3.5 py-3 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-[#D6B47A]/50 focus:ring-1 focus:ring-[#D6B47A]/15"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                            Price
                          </label>

                          <div className="relative">
                            <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />

                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={tier.price}
                              onChange={(event) =>
                                updateTier(
                                  index,
                                  'price',
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-white/10 bg-[#080808] py-3 pl-9 pr-3 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-[#D6B47A]/50 focus:ring-1 focus:ring-[#D6B47A]/15"
                            />
                          </div>

                          <p className="mt-1.5 text-[10px] text-white/25">
                            {formatPrice(tier.price)} per ticket
                          </p>
                        </div>

                        <div>
                          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                            Capacity
                          </label>

                          <input
                            type="number"
                            min="1"
                            value={tier.quantity}
                            onChange={(event) =>
                              updateTier(
                                index,
                                'quantity',
                                event.target.value,
                              )
                            }
                            className="w-full rounded-xl border border-white/10 bg-[#080808] px-3 py-3 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-[#D6B47A]/50 focus:ring-1 focus:ring-[#D6B47A]/15"
                          />

                          <p className="mt-1.5 text-[10px] text-white/25">
                            Total tickets
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-4 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="w-full sm:max-w-[220px]">
                          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                            Maximum per order
                          </label>

                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={tier.maxPerBooking}
                            onChange={(event) =>
                              updateTier(
                                index,
                                'maxPerBooking',
                                event.target.value,
                              )
                            }
                            className="w-full rounded-xl border border-white/10 bg-[#080808] px-3 py-3 text-xs text-white outline-none transition focus:border-[#D6B47A]/50 focus:ring-1 focus:ring-[#D6B47A]/15"
                          />
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-white/25">
                          <ShieldCheck className="h-3.5 w-3.5 text-[#D6B47A]/60" />
                          Maximum 10 tickets per order
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addTier}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-4 text-xs font-semibold text-white/35 transition hover:border-[#D6B47A]/30 hover:bg-[#D6B47A]/[0.03] hover:text-[#D6B47A]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add another ticket tier
                  </button>
                </div>
              </section>
            </div>

            {/* RIGHT SUMMARY */}
            <aside className="space-y-6">
              <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080808]">
                <div className="border-b border-white/[0.07] px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    Event summary
                  </p>
                </div>

                <div className="divide-y divide-white/[0.06]">
                  <div className="p-5">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
                      Event
                    </p>

                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-white/80">
                      {name.trim() || 'Untitled event'}
                    </p>

                    <p className="mt-1 text-[11px] text-white/30">
                      {category}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                    <div className="p-5">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/30">
                        Tiers
                      </p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {tiers.length}
                      </p>
                    </div>

                    <div className="p-5">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/30">
                        Capacity
                      </p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {totalCapacity.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                    <div className="p-5">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/30">
                        Paid
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white/70">
                        {paidTiers}
                      </p>
                    </div>

                    <div className="p-5">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/30">
                        Free
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white/70">
                        {freeTiers}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#D6B47A]/15 bg-[#D6B47A]/[0.04] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D6B47A]/20 bg-[#D6B47A]/10">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#D6B47A]" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#E4C995]">
                      Draft workflow
                    </p>

                    <p className="mt-2 text-[11px] leading-5 text-white/40">
                      New events are created as drafts. Review the event,
                      ticket inventory and schedule before moving it through
                      the publishing workflow.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.08] bg-[#080808] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                  Before you create
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-1.5 w-1.5 rounded-full ${
                        name.trim()
                          ? 'bg-emerald-400'
                          : 'bg-white/20'
                      }`}
                    />
                    <span className="text-xs text-white/50">
                      Event title
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-1.5 w-1.5 rounded-full ${
                        startAt && endAt
                          ? 'bg-emerald-400'
                          : 'bg-white/20'
                      }`}
                    />
                    <span className="text-xs text-white/50">
                      Event schedule
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-1.5 w-1.5 rounded-full ${
                        venueName.trim() && venueCity.trim()
                          ? 'bg-emerald-400'
                          : 'bg-white/20'
                      }`}
                    />
                    <span className="text-xs text-white/50">
                      Venue & location
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-1.5 w-1.5 rounded-full ${
                        tiers.some((tier) => tier.name.trim())
                          ? 'bg-emerald-400'
                          : 'bg-white/20'
                      }`}
                    />
                    <span className="text-xs text-white/50">
                      Ticket inventory
                    </span>
                  </div>
                </div>
              </section>
            </aside>
          </div>

          {/* ACTION BAR */}
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/organizer/events"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-xs font-semibold text-white/60 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading || created}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D6B47A] px-6 py-3 text-xs font-bold text-[#090909] shadow-[0_10px_30px_rgba(214,180,122,0.12)] transition hover:bg-[#E2C48F] hover:shadow-[0_12px_34px_rgba(214,180,122,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {created ? (
                <>
                  <Check className="h-4 w-4" />
                  Event Created
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {loading ? 'Creating Event...' : 'Create Draft Event'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}