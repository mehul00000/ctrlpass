"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Play, Star } from "lucide-react";
import clsx from "clsx";
import { PosterImage } from "@/components/PosterImage";
import { EmptyState } from "@/components/States";
import type { Episode } from "@/lib/tmdb-types";
import type { SeasonSummary } from "@/lib/tmdb-types";

/**
 * Season selector + episode list. Episodes load from the TMDB season endpoint
 * on demand and each row deep-links into the player for that episode.
 */
export function SeasonBrowser({
  tvId,
  seasons,
}: {
  tvId: number;
  seasons: SeasonSummary[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(seasons[0]?.seasonNumber ?? 1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(`/api/tv/season/${selected}?tvId=${tvId}`)
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((data: { episodes: Episode[] }) => {
        if (alive) setEpisodes(data.episodes ?? []);
      })
      .catch(() => alive && setError("Could not load episodes for this season."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tvId, selected]);

  const playEpisode = (ep: Episode) => {
    router.push(`/watch/tv/${tvId}?season=${ep.seasonNumber}&episode=${ep.episodeNumber}`);
  };

  if (!seasons.length) {
    return (
      <EmptyState
        title="No season information"
        description="TMDB doesn't have season data for this show yet."
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="section-title">Episodes</h2>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          Season
          <select
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
            className="input-dark !w-auto appearance-none !py-2"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.seasonNumber} className="bg-[#2b0008]">
                {s.name} {s.airDate ? `(${s.airDate.slice(0, 4)})` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton aspect-video w-40 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2 py-1">
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Something went wrong" description={error} />
      ) : episodes.length === 0 ? (
        <EmptyState
          title="No episodes listed"
          description="TMDB has no episode data for this season yet."
        />
      ) : (
        <ol className="space-y-4">
          {episodes.map((ep) => (
            <li key={ep.id}>
              <button
                onClick={() => playEpisode(ep)}
                className="group flex w-full items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-left transition-all hover:border-brand/40 hover:bg-brand-deep/20"
              >
                <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-xl sm:w-40">
                  <PosterImage
                    path={ep.stillPath}
                    alt={ep.name}
                    size="w500"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand shadow-glow">
                      <Play className="h-4 w-4 fill-current text-white" />
                    </span>
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-semibold text-white">
                      {ep.episodeNumber}. {ep.name}
                    </p>
                    {ep.voteAverage > 0 && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-brand-peach">
                        <Star className="h-3 w-3 fill-brand-peach" /> {ep.voteAverage.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-neutral-400">
                    {ep.airDate && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> {ep.airDate}
                      </span>
                    )}
                    {ep.runtime ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {ep.runtime}m
                      </span>
                    ) : null}
                  </div>
                  {ep.overview && (
                    <p className={clsx("mt-1.5 text-sm leading-relaxed text-neutral-400", "line-clamp-2")}>
                      {ep.overview}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
