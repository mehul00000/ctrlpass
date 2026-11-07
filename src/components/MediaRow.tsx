"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import clsx from "clsx";
import { MediaCard } from "./MediaCard";
import type { MediaItem } from "@/lib/tmdb-types";

/**
 * Horizontally scrolling carousel of media cards with edge-fade and arrows.
 * Data comes straight from TMDB endpoints — rows populate automatically.
 */
export function MediaRow({
  title,
  items,
  genreMap,
  exploreHref,
  showMediaType = false,
  cardWidth = "w-[150px] sm:w-[170px] lg:w-[190px] tv:w-[240px]",
}: {
  title: string;
  items: MediaItem[];
  genreMap?: Record<number, string>;
  exploreHref?: string;
  showMediaType?: boolean;
  cardWidth?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  const scroll = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <section className="group/row relative">
      <div className="container-page mb-4 flex items-end justify-between gap-4">
        <h2 className="section-title">
          {title}
          <span className="mt-1.5 block h-1 w-10 rounded-full bg-brand" />
        </h2>
        {exploreHref && (
          <Link
            href={exploreHref}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-peach opacity-0 transition-opacity hover:text-white group-hover/row:opacity-100 sm:opacity-100"
          >
            Explore all <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={updateArrows}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 px-4 sm:px-6 lg:px-10"
        >
          {items.map((item, i) => (
            <MediaCard
              key={`${item.mediaType}-${item.id}`}
              item={item}
              genreMap={genreMap}
              showMediaType={showMediaType}
              eager={i < 6}
              className={clsx("snap-start shrink-0", cardWidth)}
            />
          ))}
        </div>

        {canLeft && (
          <button
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="absolute left-1 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-brand-dark/85 text-white shadow-card backdrop-blur transition-all hover:bg-brand lg:grid tv:h-14 tv:w-14"
          >
            <ChevronLeft className="h-5 w-5 tv:h-7 tv:w-7" />
          </button>
        )}
        {canRight && (
          <button
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="absolute right-1 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-brand-dark/85 text-white shadow-card backdrop-blur transition-all hover:bg-brand lg:grid tv:h-14 tv:w-14"
          >
            <ChevronRight className="h-5 w-5 tv:h-7 tv:w-7" />
          </button>
        )}
      </div>
    </section>
  );
}

export function MediaRowSkeleton() {
  return (
    <section>
      <div className="container-page mb-4">
        <div className="skeleton h-6 w-48" />
      </div>
      <div className="no-scrollbar flex gap-4 overflow-hidden px-4 sm:px-6 lg:px-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-[150px] shrink-0 sm:w-[170px] lg:w-[190px]">
            <div className="skeleton aspect-[2/3] w-full rounded-2xl" />
          </div>
        ))}
      </div>
    </section>
  );
}
