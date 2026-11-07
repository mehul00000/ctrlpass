import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMovieDetails } from "@/lib/tmdb";
import { DetailsHero } from "@/components/details/DetailsHero";
import { CastRow, CompanyLogos, InfoGrid } from "@/components/details/DetailsParts";
import { ReviewsSection } from "@/components/details/ReviewsSection";
import { MediaRow } from "@/components/MediaRow";
import { CatalogError } from "@/components/CatalogError";
import { getMovieGenres } from "@/lib/tmdb";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const movie = await getMovieDetails(Number(id));
    return {
      title: `${movie.title} (${movie.releaseDate?.slice(0, 4) ?? ""})`,
      description: movie.overview.slice(0, 200),
    };
  } catch {
    return { title: "Movie" };
  }
}

export default async function MovieDetailsPage({ params }: Props) {
  const { id } = await params;
  const tmdbId = Number(id);
  if (!Number.isInteger(tmdbId)) notFound();

  const [movie, genres] = await Promise.all([
    getMovieDetails(tmdbId).catch(() => null),
    getMovieGenres().catch(() => []),
  ]);
  if (!movie) return <CatalogError />;
  const genreMap = Object.fromEntries(genres.map((g) => [g.id, g.name]));
  const directors = movie.crew.filter((c) => c.job === "Director").map((c) => c.name);
  const writers = movie.crew
    .filter((c) => c.job === "Screenplay" || c.job === "Writer")
    .map((c) => c.name)
    .slice(0, 3);

  const money = (n: number) =>
    n > 0 ? `$${(n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 0 })}M` : "—";

  const similar = [...movie.recommendations, ...movie.similar].slice(0, 20);

  return (
    <div className="pb-16">
      <DetailsHero
        data={{
          id: movie.id,
          mediaType: "movie",
          title: movie.title,
          originalTitle: movie.originalTitle,
          tagline: movie.tagline,
          overview: movie.overview,
          posterPath: movie.posterPath,
          backdropPath: movie.backdropPath,
          logoPath: movie.logoPath,
          releaseDate: movie.releaseDate,
          runtime: movie.runtime,
          voteAverage: movie.voteAverage,
          voteCount: movie.voteCount,
          status: movie.status,
          genres: movie.genres,
          trailerKey: movie.videos[0]?.key ?? null,
        }}
      />

      <div className="container-page mt-12 space-y-12">
        <CastRow cast={movie.cast} />

        <section>
          <h2 className="section-title mb-5">Production Details</h2>
          <InfoGrid
            facts={[
              { label: "Release Date", value: movie.releaseDate ?? "—" },
              { label: "Runtime", value: movie.runtime ? `${movie.runtime} min` : "—" },
              { label: "Status", value: movie.status },
              { label: "Original Language", value: movie.originalLanguage.toUpperCase() },
              { label: "Budget", value: money(movie.budget) },
              { label: "Revenue", value: money(movie.revenue) },
              ...(directors.length ? [{ label: "Director" as const, value: directors.join(", ") }] : []),
              ...(writers.length ? [{ label: "Writers" as const, value: writers.join(", ") }] : []),
            ]}
          />
          {movie.productionCompanies.length > 0 && (
            <div className="mt-8 border-t border-white/5 pt-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Production Companies
              </p>
              <CompanyLogos companies={movie.productionCompanies} />
            </div>
          )}
        </section>

        <ReviewsSection tmdbId={movie.id} mediaType="movie" />
      </div>

      {similar.length > 0 && (
        <div className="mt-14 space-y-12">
          <MediaRow title="More Like This" items={similar} genreMap={genreMap} />
        </div>
      )}
    </div>
  );
}
