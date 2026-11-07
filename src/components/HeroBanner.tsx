"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Info, Play, Star } from "lucide-react";
import clsx from "clsx";
import { BackdropImage, PosterImage } from "./PosterImage";
import type { MediaItem } from "@/lib/tmdb-types";

const ROTATE_MS = 5000;

/**
 * Cinematic hero carousel — automatically populated from TMDB trending data.
 * Auto-rotates every 5s, and users can navigate manually whenever they want:
 * swipe (mobile), edge arrows + arrow keys (PC / Android TV). Manual
 * navigation resets the auto-rotate countdown.
 */
export function HeroBanner({
  items,
  genreMap,
}: {
  items: MediaItem[];
  genreMap: Record<number, string>;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  // Auto-rotate — restarts whenever index changes, so manual navigation
  // always gets a fresh full interval.
  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [items.length, index]);

  // Keyboard arrows — PC arrow keys and Android TV D-pad.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // Touch swipe — mobile.
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  if (!items.length) return null;
  const item = items[index];
  const year = item.releaseDate?.slice(0, 4);
  const genres = item.genreIds
    .map((g) => genreMap[g])
    .filter(Boolean)
    .slice(0, 3);

  const play = () => router.push(`/watch/${item.mediaType}/${item.id}`);

  return (
    <section
      className="relative h-[78vh] min-h-[540px] w-full overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Backdrop crossfade */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <BackdropImage
            path={item.backdropPath ?? item.posterPath}
            alt={item.title}
            priority={index === 0}
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#38000Ae6] via-[#38000a80] to-transparent" />

      {/* Content */}
      <div className="container-page relative z-10 flex h-full items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
                {item.mediaType === "movie" ? "Featured Movie" : "Featured Series"}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-brand-peach backdrop-blur-sm">
                Trending Now
              </span>
            </div>

            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {item.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-200">
              {item.voteAverage > 0 && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-brand-peach">
                  <Star className="h-4 w-4 fill-brand-peach" />
                  {item.voteAverage.toFixed(1)}
                  <span className="text-xs font-normal text-neutral-400">TMDB</span>
                </span>
              )}
              {year && <span>{year}</span>}
              {genres.length > 0 && <span className="text-neutral-300">{genres.join(" · ")}</span>}
              <span className="capitalize">
                {item.mediaType === "movie" ? "Movie" : "TV Series"}
              </span>
            </div>

            {item.overview && (
              <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-neutral-300 sm:text-base">
                {item.overview}
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button onClick={play} className="btn-primary !px-7">
                <Play className="h-4 w-4 fill-current" /> Watch Now
              </button>
              <Link
                href={`/${item.mediaType}/${item.id}`}
                className="btn-secondary !px-7"
              >
                <Info className="h-4 w-4" /> More Info
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Manual navigation — arrows work on PC (click/keys) and TV (D-pad);
          swiping covers mobile */}
      {items.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous featured title"
            className="absolute left-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition-all hover:bg-brand focus-visible:bg-brand sm:left-5 sm:h-12 sm:w-12"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goNext}
            aria-label="Next featured title"
            className="absolute right-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition-all hover:bg-brand focus-visible:bg-brand sm:right-5 sm:h-12 sm:w-12"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Poster thumb + carousel dots + prev/next cluster */}
      <div className="absolute bottom-8 right-6 z-10 hidden items-center gap-4 lg:flex">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.5 }}
          >
            <PosterImage
              path={item.posterPath}
              alt={item.title}
              size="w185"
              className="w-24 rounded-xl border border-white/15 object-cover shadow-card"
            />
          </motion.div>
        </AnimatePresence>
        {items.length > 1 && (
          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              aria-label="Previous featured title"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-2">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Show ${it.title}`}
                  className={clsx(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === index ? "w-8 bg-brand" : "w-4 bg-white/25 hover:bg-white/50"
                  )}
                />
              ))}
            </div>
            <button
              onClick={goNext}
              aria-label="Next featured title"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
