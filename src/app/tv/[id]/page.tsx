import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMovieGenres, getTVDetails } from "@/lib/tmdb";
import { DetailsHero } from "@/components/details/DetailsHero";
import { CastRow, CompanyLogos, InfoGrid } from "@/components/details/DetailsParts";
import { SeasonBrowser } from "@/components/details/SeasonBrowser";
import { ReviewsSection } from "@/components/details/ReviewsSection";
import { MediaRow } from "@/components/MediaRow";
import { CatalogError } from "@/components/CatalogError";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const show = await getTVDetails(Number(id));
    return {
      title: `${show.title} (${show.releaseDate?.slice(0, 4) ?? ""})`,
      description: show.overview.slice(0, 200),
    };
  } catch {
    return { title: "TV Show" };
  }
}

export default async function TVDetailsPage({ params }: Props) {
  const { id } = await params;
  const tmdbId = Number(id);
  if (!Number.isInteger(tmdbId)) notFound();

  const [show, genres] = await Promise.all([
    getTVDetails(tmdbId).catch(() => null),
    getMovieGenres().catch(() => []),
  ]);
  if (!show) return <CatalogError />;
  const genreMap = Object.fromEntries(genres.map((g) => [g.id, g.name]));

  const creators = show.crew.filter((c) => c.job === "Creator").map((c) => c.name);
  const similar = [...show.recommendations, ...show.similar].slice(0, 20);

  return (
    <div className="pb-16">
      <DetailsHero
        data={{
          id: show.id,
          mediaType: "tv",
          title: show.title,
          originalTitle: show.originalTitle,
          tagline: show.tagline,
          overview: show.overview,
          posterPath: show.posterPath,
          backdropPath: show.backdropPath,
          logoPath: show.logoPath,
          releaseDate: show.releaseDate,
          runtime: show.runtime,
          seasons: show.numberOfSeasons,
          episodes: show.numberOfEpisodes,
          voteAverage: show.voteAverage,
          voteCount: show.voteCount,
          status: show.status,
          genres: show.genres,
          trailerKey: show.videos[0]?.key ?? null,
        }}
      />

      <div className="container-page mt-12 space-y-12">
        <SeasonBrowser tvId={show.id} seasons={show.seasons} />
        <CastRow cast={show.cast} />

        <section>
          <h2 className="section-title mb-5">Show Details</h2>
          <InfoGrid
            facts={[
              { label: "First Aired", value: show.releaseDate ?? "—" },
              { label: "Last Aired", value: show.lastAirDate ?? "—" },
              { label: "Status", value: show.status },
              { label: "Original Language", value: show.originalLanguage.toUpperCase() },
              { label: "Seasons", value: String(show.numberOfSeasons) },
              { label: "Episodes", value: String(show.numberOfEpisodes) },
              { label: "Episode Runtime", value: show.episodeRunTime.length ? `${show.episodeRunTime.join(", ")} min` : "—" },
              ...(creators.length ? [{ label: "Created By" as const, value: creators.join(", ") }] : []),
            ]}
          />
          {(show.networks.length > 0 || show.productionCompanies.length > 0) && (
            <div className="mt-8 border-t border-white/5 pt-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Networks & Production
              </p>
              <CompanyLogos companies={[...show.networks, ...show.productionCompanies]} />
            </div>
          )}
        </section>

        <ReviewsSection tmdbId={show.id} mediaType="tv" />
      </div>

      {similar.length > 0 && (
        <div className="mt-14">
          <MediaRow title="More Like This" items={similar} genreMap={genreMap} />
        </div>
      )}
    </div>
  );
}
