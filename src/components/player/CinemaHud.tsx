"use client";

// ---------------------------------------------------------------------------
// Minimal cinema HUD — always visible, and crucially: the container is
// pointer-events-none with pointer-events-auto only on the actual controls,
// so clicks pass through to the provider's player (pause/play/seek/volume/
// quality/subtitles inside the embed keep working).
//
// No fullscreen button here on purpose: the provider's own fullscreen control
// handles it — a second one would just be confusing.
// ---------------------------------------------------------------------------

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, List, Maximize, Minimize, X } from "lucide-react";
import clsx from "clsx";
import { SeasonBrowser } from "@/components/details/SeasonBrowser";
import type { SeasonSummary } from "@/lib/tmdb-types";

interface Props {
  backHref: string;
  title: string;
  isTv: boolean;
  prevHref: string | null;
  nextHref: string | null;
  seasons: Array<{ id: number; name: string; seasonNumber: number; episodeCount: number; posterPath: string | null; airDate: string | null; overview: string }>;
  tvId: number;
}

export function CinemaHud({ backHref, title, isTv, prevHref, nextHref, seasons, tvId }: Props) {
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Manual fullscreen toggle — never automatic.
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    } else {
      await document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    }
  };

  return (
    <>
      {/* HUD container — never intercepts clicks (pointer-events-none) */}
      <div className="pointer-events-none absolute inset-0 z-[80]">
        {/* Top bar — gradient is visual only; only the buttons accept clicks,
            so the provider's Quality / Audio & Subtitles controls underneath
            remain clickable */}
        {/* Buttons stacked on the left edge — clear of the provider's own
            title display (top-left inside their player) */}
        <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
          <Link
            href={backHref}
            className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-brand"
            aria-label="Back to details"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button
            onClick={toggleFullscreen}
            className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-white/20"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>

        {/* TV: episode navigation — only the buttons accept clicks */}
        {isTv && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent p-5">
            {prevHref ? (
              <Link href={prevHref} className="btn-secondary pointer-events-auto !py-2.5">
                <ChevronLeft className="h-4 w-4" /> Previous Episode
              </Link>
            ) : (
              <span className="btn-secondary pointer-events-none !py-2.5 opacity-40" aria-disabled>
                <ChevronLeft className="h-4 w-4" /> Previous Episode
              </span>
            )}
            <button onClick={() => setEpisodesOpen(true)} className="btn-secondary pointer-events-auto !py-2.5">
              <List className="h-4 w-4" /> Episodes
            </button>
            {nextHref ? (
              <Link href={nextHref} className="btn-primary pointer-events-auto !py-2.5">
                Next Episode <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="btn-primary pointer-events-none !py-2.5 opacity-40" aria-disabled>
                Next Episode <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        )}
      </div>

      {/* TV: season / episode drawer */}
      {isTv && episodesOpen && (
        <div className="absolute inset-y-0 right-0 z-[85] w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#1c0005]/95 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Episodes</h2>
            <button
              onClick={() => setEpisodesOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Close episodes"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <SeasonBrowser tvId={tvId} seasons={seasons} />
        </div>
      )}
    </>
  );
}
