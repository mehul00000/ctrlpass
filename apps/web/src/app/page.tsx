'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConfigNotice from '@/components/ConfigNotice';
import { isSupabaseConfigured } from '@/lib/supabase';
import { eventService } from '@/services/events';
import { Event } from '@ctrlpass/types';
import {
  formatEventDate,
  getLowestPriceFormatted,
} from '@/components/ui/EventCard';
import EventImage from '@/components/EventImage';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { userFacingError } from '@/lib/userFacingError';
import { normalizeCity } from '@/lib/city';
import { ArrowRight, ArrowUpRight, MapPin, Search } from 'lucide-react';
import AnimatedIcon from '@/components/ui/AnimatedIcon';

const CITY_OPTIONS = [
  'Delhi-NCR',
  'Mumbai',
  'Bengaluru',
  'Goa',
  'Hyderabad',
  'Pune',
];

const FALLBACK_CATEGORIES = [
  'Music',
  'Nightlife',
  'Sports',
  'Food',
  'Art',
  'Comedy',
  'Technology',
  'Culture',
];

function scrollToDiscover() {
  document.getElementById('discover')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

/* Questions carry only facts the product already states (in-app QR pass,
   organizer-published listings, organizer-set prices). */
const QUESTIONS = [
  {
    q: 'What does a ticket get me?',
    a: 'A QR pass in the app, and the gate scanner reads it once.',
  },
  {
    q: 'Who lists the events?',
    a: 'The organizers. Every listing and price is published from their dashboard.',
  },
  {
    q: 'What does it cost?',
    a: 'Organizers set their own prices. Where tiers exist, you see the lowest first.',
  },
];

export default function HomePage() {
  const [dbEvents, setDbEvents] = useState<Event[]>([]);
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoadError(null);

        const events = await eventService.listPublished();
        setDbEvents(events);
      } catch (err) {
        setDbEvents([]);
        setLoadError(
          userFacingError(
            err,
            'Could not load events. Check your connection and try again.',
          ),
        );
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const categories = useMemo(() => {
    const present = new Set(
      dbEvents.map((event) => event.category).filter(Boolean) as string[],
    );

    const ordered = FALLBACK_CATEGORIES.filter((category) =>
      present.has(category),
    );

    const extra = Array.from(present).filter(
      (category) => !ordered.includes(category),
    );

    return ['All', ...ordered, ...extra].slice(0, 9);
  }, [dbEvents]);

  const cityOptions = useMemo(() => {
    const present = new Set(
      dbEvents
        .map((event) => normalizeCity(event.venue?.city))
        .filter(Boolean) as string[],
    );

    return [
      'All Cities',
      ...CITY_OPTIONS.filter((city) => present.has(city)),
    ];
  }, [dbEvents]);

  const upcomingEvents = useMemo(() => {
    const now = Date.now();

    return dbEvents
      .filter((event) => {
        if (!event.start_at) return false;

        const timestamp = new Date(event.start_at).getTime();

        return !Number.isNaN(timestamp) && timestamp > now;
      })
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
      );
  }, [dbEvents]);

  const topCities = useMemo(() => {
    const cityMap = new Map<string, { name: string; count: number }>();

    for (const event of dbEvents) {
      const city = normalizeCity(event.venue?.city);

      if (!city) continue;

      const current = cityMap.get(city) ?? {
        name: city,
        count: 0,
      };

      current.count += 1;

      cityMap.set(city, current);
    }

    return Array.from(cityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [dbEvents]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return dbEvents.filter((event) => {
      const eventCity = normalizeCity(event.venue?.city);

      const matchesCity =
        selectedCity === 'All Cities' || eventCity === selectedCity;

      const matchesCategory =
        selectedCategory === 'All' ||
        event.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSearch =
        !query ||
        event.name?.toLowerCase().includes(query) ||
        event.venue?.city?.toLowerCase().includes(query) ||
        event.venue?.name?.toLowerCase().includes(query);

      return matchesCity && matchesCategory && matchesSearch;
    });
  }, [dbEvents, searchQuery, selectedCategory, selectedCity]);

  function pickCity(city: string) {
    setSelectedCity(city);
    scrollToDiscover();
  }

  function pickCategory(category: string) {
    setSelectedCategory(category);
    scrollToDiscover();
  }

  function resetFilters() {
    setSelectedCity('All Cities');
    setSelectedCategory('All');
    setSearchQuery('');
  }

  return (
    <div className="min-h-svh bg-[color:var(--color-paper)] text-[color:var(--color-ink)]">
      <Navbar />

      {/* HERO · Index posture · the thing itself, close */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--color-rule)]">
        <div data-slot="hero" data-alt="The organizer's own photograph of a real event or venue, full-bleed behind the head" className="absolute inset-0" aria-hidden="true">
          <Image
            src="/photos/beach-please-2022-crowd-stage-lights-night-performance-1920.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_38%]"
          />

          <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-paper)_82%,transparent),color-mix(in_oklab,var(--color-paper)_38%,transparent)_58%,color-mix(in_oklab,var(--color-paper)_66%,transparent))]" />

          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[color:var(--color-paper)] to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1360px] px-5 pb-20 pt-24 sm:px-8 lg:px-12 lg:pb-28 lg:pt-36">
          <div className="max-w-[46rem]">
            <h1 className="max-w-[14ch] text-[clamp(2.75rem,7vw,5.5rem)] [text-wrap:balance]">
              Find something worth showing up for.
            </h1>

            <p className="mt-6 max-w-[52ch] text-base leading-[1.55] text-[color:var(--color-ink-2)] sm:text-lg">
              Concerts to conferences across India, listed by the
              people who run them.
            </p>

            <div className="mt-10 max-w-4xl p-2" style={{ borderRadius: 'var(--radius-card)' }}>
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_1.2fr_auto]">
                <label className="flex items-center gap-3 border border-[color:var(--color-muted)] bg-[color:var(--color-paper-3)] px-4 py-2.5" style={{ borderRadius: 'var(--radius-well)' }}>
                  <span className="sr-only">City</span>
                  <MapPin className="h-4 w-4 shrink-0 text-[color:var(--color-muted)]" aria-hidden="true" />
                  <select
                    id="hero-city"
                    value={selectedCity}
                    onChange={(event) =>
                      setSelectedCity(event.target.value)
                    }
                    className="min-h-[44px] w-full cursor-pointer bg-transparent text-sm font-medium text-[color:var(--color-ink)] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cityOptions.map((city) => (
                      <option
                        key={city}
                        value={city}
                        className="bg-[color:var(--color-paper-2)] text-[color:var(--color-ink)]"
                      >
                        {city}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-3 border border-[color:var(--color-muted)] bg-[color:var(--color-paper-3)] px-4 py-2.5" style={{ borderRadius: 'var(--radius-well)' }}>
                  <span className="sr-only">Category</span>
                  <select
                    id="hero-category"
                    value={selectedCategory}
                    onChange={(event) =>
                      setSelectedCategory(event.target.value)
                    }
                    className="min-h-[44px] w-full cursor-pointer bg-transparent text-sm font-medium text-[color:var(--color-ink)] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                        className="bg-[color:var(--color-paper-2)] text-[color:var(--color-ink)]"
                      >
                        {category === 'All'
                          ? 'All categories'
                          : category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-3 border border-[color:var(--color-muted)] bg-[color:var(--color-paper-3)] px-4 py-2.5" style={{ borderRadius: 'var(--radius-well)' }}>
                  <Search className="h-4 w-4 shrink-0 text-[color:var(--color-muted)]" aria-hidden="true" />
                  <input
                    id="hero-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        scrollToDiscover();
                      }
                    }}
                    placeholder="Search events"
                    aria-label="Search events"
                    className="min-h-[44px] w-full bg-transparent text-sm font-medium text-[color:var(--color-ink)] outline-none placeholder:text-[color:var(--color-muted)] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </label>

                <button
                  type="button"
                  onClick={scrollToDiscover}
                  className="btn-primary group md:h-[52px] md:self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)] active:bg-[color:var(--color-focus)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Explore events
                  <AnimatedIcon icon={ArrowRight} animation="nudge-x" size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      {loading ? (
        <section className="mx-auto w-full max-w-[1360px] px-5 py-20 sm:px-8 lg:px-12">
          <LoadingState message="Loading events…" />
        </section>
      ) : loadError ? (
        <section className="mx-auto w-full max-w-[1360px] px-5 py-20 sm:px-8 lg:px-12">
          <ErrorState
            title="Could not load events"
            description={loadError}
          />
        </section>
      ) : (
        <>
          {!isSupabaseConfigured && (
            <section className="mx-auto w-full max-w-[1360px] px-5 pt-16 sm:px-8 lg:px-12">
              <ConfigNotice />
            </section>
          )}

          {/* THE LINEUP · Index, set large */}
          <section
            id="discover"
            className="scroll-mt-24"
          >
            <div className="mx-auto w-full max-w-[1360px] px-5 pb-24 pt-20 sm:px-8 lg:px-12 lg:pb-32 lg:pt-28">
              <div className="flex flex-col gap-6 border-b border-[color:var(--color-rule)] pb-8 lg:flex-row lg:items-end lg:justify-between">
                <h2 className="text-[clamp(2rem,4vw,3.25rem)] [text-wrap:balance]">
                  {selectedCategory === 'All'
                    ? 'What’s happening now'
                    : selectedCategory}
                </h2>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex items-center gap-3 border border-[color:var(--color-muted)] bg-[color:var(--color-paper-2)] px-4 py-2.5" style={{ borderRadius: 'var(--radius-well)' }}>
                    <Search className="h-4 w-4 shrink-0 text-[color:var(--color-muted)]" aria-hidden="true" />
                    <input
                      type="search"
                      placeholder="Search events or venues"
                      value={searchQuery}
                      onChange={(event) =>
                        setSearchQuery(event.target.value)
                      }
                      aria-label="Search events"
                      className="min-h-[44px] w-full bg-transparent text-sm text-[color:var(--color-ink)] outline-none placeholder:text-[color:var(--color-muted)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-64"
                    />
                  </label>

                  {(selectedCity !== 'All Cities' ||
                    selectedCategory !== 'All' ||
                    searchQuery) && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="btn-ghost min-h-[44px] px-5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)] active:bg-[color:var(--color-paper-3)]"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {categories.length > 1 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {categories
                    .filter((category) => category !== 'All')
                    .slice(0, 8)
                    .map((category) => {
                      const selected = selectedCategory === category;

                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => pickCategory(category)}
                          aria-pressed={selected}
                          className={`min-h-[44px] rounded-[var(--radius-pill)] px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)] active:opacity-80 ${
                            selected
                              ? 'bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)]'
                              : 'text-[color:var(--color-ink-2)] shadow-[inset_0_0_0_var(--rule-hair)_var(--color-rule)] hover:bg-[color:var(--color-paper-2)] hover:text-[color:var(--color-ink)]'
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                </div>
              )}

              {filteredEvents.length === 0 ? (
                <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
                  <div>
                    <p className="text-[color:var(--color-muted)]">
                      Nothing here yet. The first published event lands in
                      this list the moment an organizer switches it on.
                    </p>

                    <button
                      type="button"
                      onClick={resetFilters}
                      className="btn-ghost mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)] active:bg-[color:var(--color-paper-3)]"
                    >
                      Clear filters
                    </button>
                  </div>

                  <figure
                    data-slot="photo-empty"
                    className="photo relative overflow-hidden"
                    style={{
                      borderRadius: 'var(--radius-card)',
                      aspectRatio: '16 / 9',
                    }}
                  >
                    <Image
                      src="/photos/tianjin-grand-theater-concert-hall-1920.jpg"
                      alt="A concert hall with tiered wooden seating, waiting for an audience"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </figure>
                </div>
              ) : (
                <ul className="divide-y divide-[color:var(--color-rule)]">
                  {filteredEvents.map((event) => (
                    <li key={event.id}>
                      <Link
                        href={`/events/${event.id}`}
                        className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 py-6 transition-colors lg:grid-cols-[7rem_minmax(0,1fr)_10rem_auto] lg:gap-8"
                      >
                        <time
                          dateTime={event.start_at ?? undefined}
                          className="font-display text-xl leading-none tracking-[-0.03em] text-[color:var(--color-ink)] [font-variant-numeric:tabular-nums] sm:text-2xl"
                        >
                          {formatEventDate(event.start_at)}
                        </time>

                        <span className="min-w-0">
                          <span className="block truncate font-display text-2xl leading-tight sm:text-3xl">
                            {event.name}
                          </span>

                          <span className="mt-1 block truncate text-sm text-[color:var(--color-muted)]">
                            {event.venue?.name
                              ? `${event.venue.name}, `
                              : ''}
                            {normalizeCity(event.venue?.city) || 'India'}
                          </span>
                        </span>

                        <span className="hidden text-sm text-[color:var(--color-ink-2)] lg:block">
                          {getLowestPriceFormatted(event.ticket_types)}
                        </span>

                        <EventImage
                          src={event.cover_image_url}
                          alt=""
                          className="hidden shrink-0 sm:block"
                          aspectClassName="h-[72px] w-[112px]"
                        />

                        <ArrowUpRight
                          className="h-5 w-5 shrink-0 text-[color:var(--color-muted)] transition-colors group-hover:text-[color:var(--color-accent)]"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* THE PLACES · how to get there */}
          {topCities.length > 0 && (
            <section className="border-t border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]">
              <div className="mx-auto w-full max-w-[1360px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
                <h2 className="text-[clamp(2rem,4vw,3.25rem)]">
                  Where the doors are
                </h2>

                <ul className="mt-10 divide-y divide-[color:var(--color-rule)] border-y border-[color:var(--color-rule)]">
                  {topCities.map((city) => (
                    <li key={city.name}>
                      <button
                        type="button"
                        onClick={() => pickCity(city.name)}
                        className="group flex w-full items-center justify-between gap-6 py-5 text-left"
                      >
                        <span className="font-display text-2xl sm:text-3xl">
                          {city.name}
                        </span>

                        <span className="flex items-center gap-4 text-sm text-[color:var(--color-muted)]">
                          {city.count}
                          {city.count === 1 ? ' event' : ' events'}
                          <ArrowUpRight
                            className="h-4 w-4 transition-colors group-hover:text-[color:var(--color-accent)]"
                            aria-hidden="true"
                          />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* QUESTIONS · rows */}
          <section className="border-t border-[color:var(--color-rule)]">
            <div className="mx-auto w-full max-w-[1360px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
              <h2 className="text-[clamp(2rem,4vw,3.25rem)] [text-wrap:balance]">
                Before you book
              </h2>

              <dl className="mt-10 divide-y divide-[color:var(--color-rule)] border-y border-[color:var(--color-rule)]">
                {QUESTIONS.map(({ q, a }) => (
                  <div
                    key={q}
                    className="grid gap-3 py-6 lg:grid-cols-[24rem_minmax(0,1fr)] lg:gap-12"
                  >
                    <dt className="font-display text-xl leading-snug sm:text-2xl">
                      {q}
                    </dt>

                    <dd className="max-w-[65ch] text-base leading-[1.6] text-[color:var(--color-ink-2)]">
                      {a}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* ORGANIZERS */}
          <section className="border-t border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]">
            <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-20">
              <div className="max-w-2xl">
                <h2 className="text-[clamp(2rem,4vw,3.25rem)] [text-wrap:balance]">
                  Your event deserves a bigger room.
                </h2>

                <p className="mt-4 max-w-xl text-base leading-[1.6] text-[color:var(--color-muted)]">
                  Create events, sell tickets, manage attendees and run your
                  entire event operation from one place.
                </p>
              </div>

              <Link
                href="/organizer/events/new"
                className="btn-primary shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)] active:bg-[color:var(--color-focus)]"
              >
                Create your event
              </Link>
            </div>
          </section>

          {/* CLOSE · tickets again */}
          <section className="border-t border-[color:var(--color-rule)]">
            <div className="mx-auto w-full max-w-[1360px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
              <p className="max-w-[24ch] font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.0]">
                Doors open all year.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={scrollToDiscover}
                  className="btn-primary group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)] active:bg-[color:var(--color-focus)]"
                >
                  Find events
                  <AnimatedIcon icon={ArrowRight} animation="nudge-x" size={16} />
                </button>

                <Link href="/events" className="btn-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)] active:bg-[color:var(--color-paper-3)]">
                  See the full listing
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}
