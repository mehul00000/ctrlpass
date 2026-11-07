"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { PosterImage } from "./PosterImage";
import { ResumeButton } from "./States";
import type { HistoryItem } from "@/lib/persistence";

/** Continue-watching / history card with progress bar and resume link. */
export function ProgressLinkCard({ entry }: { entry: HistoryItem }) {
  const href = `/watch/${entry.mediaType}/${entry.tmdbId}${
    entry.seasonNumber !== undefined && entry.episodeNumber !== undefined
      ? `?season=${entry.seasonNumber}&episode=${entry.episodeNumber}`
      : ""
  }`;

  return (
    <Link
      href={href}
      className="group relative w-[210px] shrink-0 overflow-hidden rounded-2xl bg-brand-deep/30 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover sm:w-[240px]"
    >
      <div className="relative aspect-video">
        <PosterImage
          path={entry.backdropPath ?? entry.posterPath}
          alt={entry.title}
          size="w500"
          sizes="240px"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#38000Aee] via-transparent to-transparent" />
        <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand shadow-glow">
            <Play className="h-5 w-5 fill-current text-white" />
          </span>
        </span>
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-white">{entry.title}</p>
        <div className="mt-2">
          <ResumeButton entry={entry} />
        </div>
      </div>
    </Link>
  );
}
