"use client";

import Link from "next/link";
import { Event, TicketType } from "@ctrlpass/types";
import { ArrowUpRight, MapPin } from "lucide-react";
import EventImage from "@/components/EventImage";

interface EventCardProps {
  event: Event;
  variant?: "standard" | "compact" | "featured";
}

export function formatEventDate(isoString?: string) {
  if (!isoString) return "Date TBA";

  try {
    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
      return isoString;
    }

    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return isoString;
  }
}

export function getLowestPriceFormatted(ticketTypes?: TicketType[]) {
  if (!ticketTypes || ticketTypes.length === 0) {
    return "TBA";
  }

  const active = ticketTypes.filter(
    (ticket) => ticket.status === "ACTIVE" || !ticket.status,
  );

  if (active.length === 0) {
    return "Sold Out";
  }

  const minMinor = Math.min(
    ...active.map((ticket) => ticket.price_minor || 0),
  );

  if (minMinor === 0) {
    return "FREE";
  }

  return `₹${(minMinor / 100).toLocaleString("en-IN")}`;
}

function Location({ event, compact = false }: { event: Event; compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 ${
        compact ? "text-xs" : "text-sm"
      } text-[#A7A39B]`}
    >
      <MapPin
        className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} shrink-0 text-[#D6B47A]`}
        aria-hidden
      />

      <span className="truncate">
        {event.venue?.name ? `${event.venue.name}, ` : ""}
        {event.venue?.city || "India"}
      </span>
    </div>
  );
}

export default function EventCard({
  event,
  variant = "standard",
}: EventCardProps) {
  const lowestPrice = getLowestPriceFormatted(event.ticket_types);

  if (variant === "featured") {
    return (
      <Link
        href={`/events/${event.id}`}
        className="group block rounded-[2rem] border border-white/[0.07] bg-white/[0.025] p-1.5 transition-all duration-300 hover:border-[#D6B47A]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A] sm:p-2"
      >
        <div className="flex overflow-hidden rounded-[1.65rem] bg-[#0B0B0B] flex-col lg:flex-row">
          <div className="relative min-h-[300px] overflow-hidden lg:w-7/12 lg:min-h-[420px]">
            <EventImage
              src={event.cover_image_url}
              alt={event.name}
              className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
              aspectClassName="h-full min-h-[300px]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/70 via-transparent to-transparent" />

            <div className="absolute left-4 top-4">
              <span className="rounded-full border border-[#D6B47A]/30 bg-[#D6B47A] px-3.5 py-1.5 text-xs font-bold text-[#050505]">
                Featured
              </span>
            </div>

            <div className="absolute bottom-4 right-4 rounded-full border border-white/[0.12] bg-[#050505]/90 px-3.5 py-2 text-right backdrop-blur-md">
              <span className="font-mono text-xs font-bold tabular-nums text-[#F5F5F2]">
                {formatEventDate(event.start_at)}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-8 p-7 sm:p-10 lg:w-5/12">
            <div className="space-y-4">
              <span className="inline-block font-mono text-[10px] uppercase tracking-[0.16em] text-[#77736C]">
                {event.category || "Live event"}
              </span>

              <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-[#F5F5F2] transition-colors group-hover:text-[#D6B47A] sm:text-3xl">
                {event.name}
              </h3>

              <Location event={event} />

              <p className="max-w-prose line-clamp-3 text-sm leading-relaxed text-[#A7A39B]">
                {event.description || "Discover this event on CtrlPass."}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-white/[0.07] pt-6">
              <div>
                <span className="block text-xs text-[#77736C]">
                  Passes from
                </span>

                <span className="font-mono text-2xl font-bold tabular-nums text-[#F5F5F2]">
                  {lowestPrice}
                </span>
              </div>

              <span className="inline-flex items-center gap-2.5 rounded-full bg-[#D6B47A] py-1.5 pl-5 pr-1.5 text-sm font-bold text-[#050505] transition-colors group-hover:bg-[#E2C58F]">
                Reserve pass

                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#050505]/10">
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        href={`/events/${event.id}`}
        className="group flex gap-4 rounded-2xl border border-white/[0.07] bg-[#0B0B0B] p-3 transition-all duration-300 hover:border-[#D6B47A]/30 hover:bg-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]"
      >
        <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl">
          <EventImage
            src={event.cover_image_url}
            alt={event.name || "Event Poster"}
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
            aspectClassName="h-full"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/40 to-transparent" />
        </div>

        <div className="min-w-0 flex-1 py-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#D6B47A]">
                {event.category || "Live event"}
              </span>

              <h3 className="mt-1 line-clamp-2 font-display text-sm font-semibold leading-tight text-[#F5F5F2] transition-colors group-hover:text-[#D6B47A]">
                {event.name}
              </h3>
            </div>

            <ArrowUpRight className="h-4 w-4 shrink-0 text-[#77736C] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#D6B47A]" />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] text-[#77736C]">
              {formatEventDate(event.start_at)}
            </span>

            <span className="font-mono text-xs font-semibold text-[#F5F5F2]">
              {lowestPrice}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block rounded-[1.75rem] border border-white/[0.07] bg-white/[0.025] p-1.5 transition-all duration-300 hover:border-[#D6B47A]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[1.4rem] bg-[#0B0B0B]">
        <div className="relative aspect-[16/10] overflow-hidden">
          <EventImage
            src={event.cover_image_url}
            alt={event.name || "Event Poster"}
            className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
            aspectClassName="aspect-[16/10]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/50 via-transparent to-transparent" />

          <div className="absolute left-3.5 top-3.5">
            <span className="rounded-full border border-[#D6B47A]/25 bg-[#050505]/85 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#D6B47A] backdrop-blur-md">
              {event.category || "Live event"}
            </span>
          </div>

          <div className="absolute bottom-3.5 right-3.5 rounded-full border border-white/[0.10] bg-[#050505]/90 px-3 py-1.5 text-right backdrop-blur-md">
            <span className="font-mono text-[10px] font-semibold tabular-nums text-[#F5F5F2]">
              {formatEventDate(event.start_at)}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4 p-5">
          <div>
            <h3 className="line-clamp-2 font-display text-lg font-bold text-[#F5F5F2] transition-colors group-hover:text-[#D6B47A]">
              {event.name}
            </h3>

            <div className="mt-2">
              <Location event={event} compact />
            </div>

            {event.description && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#77736C]">
                {event.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.07] pt-4">
            <div>
              <span className="block text-[9px] font-mono uppercase tracking-[0.12em] text-[#77736C]">
                Passes from
              </span>

              <span className="font-mono text-base font-bold tabular-nums text-[#F5F5F2]">
                {lowestPrice}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D6B47A] transition-colors group-hover:text-[#E2C58F]">
              Book pass

              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}