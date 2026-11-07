"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { BackdropImage, PosterImage } from "@/components/PosterImage";
import { DetailsActions } from "./DetailsActions";
import type { MediaType } from "@/lib/persistence";

export interface DetailsHeroData {
  id: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  tagline: string | null;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  logoPath: string | null;
  releaseDate: string | null;
  runtime?: number | null;
  seasons?: number | null;
  episodes?: number | null;
  voteAverage: number;
  voteCount: number;
  status: string;
  genres: Array<{ id: number; name: string }>;
  trailerKey?: string | null;
}

function formatRuntime(mins?: number | null): string | null {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function DetailsHero({ data }: { data: DetailsHeroData }) {
  const year = data.releaseDate?.slice(0, 4);
  const runtime = formatRuntime(data.runtime);

  return (
    <section className="relative">
      <div className="relative h-[52vh] min-h-[380px] w-full sm:h-[60vh]">
        <BackdropImage
          path={data.backdropPath}
          alt={data.title}
          priority
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#38000Acc] via-[#38000a55] to-transparent" />
      </div>

      <div className="container-page relative z-10 -mt-36 sm:-mt-44">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-end">
          <PosterImage
            path={data.posterPath}
            alt={data.title}
            size="w342"
            priority
            className="w-40 shrink-0 rounded-2xl border border-white/10 object-cover shadow-card sm:w-52"
          />

          <div className="min-w-0 flex-1 pb-1">
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {data.title}
            </h1>
            {data.originalTitle !== data.title && (
              <p className="mt-1 text-sm text-neutral-400">
                Original title: <span className="italic">{data.originalTitle}</span>
              </p>
            )}
            {data.tagline && (
              <p className="mt-2 text-base italic text-brand-peach">“{data.tagline}”</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-neutral-300">
              {data.voteAverage > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-semibold text-brand-peach backdrop-blur-sm">
                  <Star className="h-4 w-4 fill-brand-peach" />
                  {data.voteAverage.toFixed(1)}
                  <span className="text-xs font-normal text-neutral-400">
                    ({data.voteCount.toLocaleString()})
                  </span>
                </span>
              )}
              {year && <span>{year}</span>}
              {runtime && <span>{runtime}</span>}
              {data.seasons ? (
                <span>
                  {data.seasons} season{data.seasons !== 1 ? "s" : ""}
                  {data.episodes ? ` · ${data.episodes} episodes` : ""}
                </span>
              ) : null}
              <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide">
                {data.status}
              </span>
              <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide">
                {data.mediaType === "movie" ? "Movie" : "TV Series"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {data.genres.map((g) => (
                <Link
                  key={g.id}
                  href={`/genres/${g.id}?type=${data.mediaType}`}
                  className="chip transition-colors hover:border-brand-peach/50 hover:text-white"
                >
                  {g.name}
                </Link>
              ))}
            </div>

            {data.overview && (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-300 sm:text-[15px]">
                {data.overview}
              </p>
            )}

            <div className="mt-6">
              <DetailsActions
                id={data.id}
                mediaType={data.mediaType}
                title={data.title}
                posterPath={data.posterPath}
                backdropPath={data.backdropPath}
                watchHref={`/watch/${data.mediaType}/${data.id}`}
                trailerKey={data.trailerKey}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
