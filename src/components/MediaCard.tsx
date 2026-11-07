"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Info, Star } from "lucide-react";
import clsx from "clsx";
import { PosterImage } from "./PosterImage";
import { useWatchlistSet, toStoreItem } from "@/lib/store-hooks";
import type { MediaItem } from "@/lib/tmdb-types";

function year(date: string | null): string {
  return date ? date.slice(0, 4) : "";
}

export function MediaCard({
  item,
  genreMap,
  showMediaType = false,
  className,
  eager = false,
}: {
  item: MediaItem;
  genreMap?: Record<number, string>;
  showMediaType?: boolean;
  className?: string;
  eager?: boolean;
}) {
  const { has, toggleItem } = useWatchlistSet();
  const inList = has(item.mediaType, item.id);
  const href = `/${item.mediaType}/${item.id}`;
  const genres = item.genreIds
    .map((g) => genreMap?.[g])
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={clsx("group relative", className)}
    >
      <Link href={href} className="block" aria-label={item.title}>
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-brand-deep/40 shadow-card transition-shadow duration-300 group-hover:shadow-card-hover">
          <PosterImage
            path={item.posterPath}
            alt={item.title}
            size="w342"
            priority={eager}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 220px"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-card-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-0 translate-y-3 p-3.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="mb-1.5 line-clamp-1 text-sm font-semibold text-white">{item.title}</p>
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <span className="inline-flex items-center gap-1 text-brand-peach">
                <Star className="h-3.5 w-3.5 fill-brand-peach" />
                {item.voteAverage ? item.voteAverage.toFixed(1) : "NR"}
              </span>
              {year(item.releaseDate) && <span>{year(item.releaseDate)}</span>}
              {genres && <span className="truncate">{genres}</span>}
            </div>
            <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              <Info className="h-3 w-3" /> More Info
            </span>
          </div>

          {/* Rating badge */}
          {item.voteAverage > 0 && (
            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-lg bg-[#38000Ad9] px-2 py-1 text-xs font-semibold text-brand-peach backdrop-blur-sm">
              <Star className="h-3 w-3 fill-brand-peach" />
              {item.voteAverage.toFixed(1)}
            </span>
          )}

          {showMediaType && (
            <span className="absolute right-2.5 top-2.5 rounded-lg bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {item.mediaType === "movie" ? "Movie" : "Series"}
            </span>
          )}
        </div>
      </Link>

      {/* Watchlist quick toggle */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleItem(toStoreItem(item));
        }}
        aria-label={inList ? "Remove from My List" : "Add to My List"}
        title={inList ? "Remove from My List" : "Add to My List"}
        className={clsx(
          "absolute right-2.5 top-2.5 z-10 grid h-8 w-8 place-items-center rounded-full backdrop-blur-sm transition-all",
          "opacity-0 group-hover:opacity-100 focus:opacity-100",
          inList
            ? "bg-brand text-white shadow-glow"
            : "bg-[#38000Ad9] text-white hover:bg-brand"
        )}
      >
        {inList ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      </button>
    </motion.article>
  );
}

export function PersonCard({
  person,
}: {
  person: { id: number; name: string; character?: string; profilePath: string | null };
}) {
  return (
    <div className="group text-center">
      <div className="relative mx-auto aspect-square w-24 overflow-hidden rounded-full border-2 border-brand-deep/60 shadow-card transition-transform duration-300 group-hover:scale-105 sm:w-28">
        <PosterImage
          path={person.profilePath}
          alt={person.name}
          size="w185"
          sizes="112px"
          className="h-full w-full object-cover"
        />
      </div>
      <p className="mt-2.5 truncate text-sm font-medium text-white">{person.name}</p>
      {person.character && (
        <p className="truncate text-xs text-neutral-400">{person.character}</p>
      )}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx("shrink-0", className)}>
      <div className="skeleton aspect-[2/3] w-full rounded-2xl" />
    </div>
  );
}
