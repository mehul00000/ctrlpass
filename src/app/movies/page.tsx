import type { Metadata } from "next";
import { getMovieGenres, getTrendingMovies } from "@/lib/tmdb";
import { DiscoverBrowser } from "@/components/DiscoverBrowser";
import { PageHeader } from "@/components/PageHeader";
import { CatalogError } from "@/components/CatalogError";

export const metadata: Metadata = {
  title: "Movies",
  description: "Discover trending, popular, top-rated and upcoming movies — updated automatically from TMDB.",
};

export const revalidate = 1800;

export default async function MoviesPage() {
  const [genres, initial] = await Promise.all([
    getMovieGenres().catch(() => []),
    getTrendingMovies("day").catch(() => null),
  ]);
  if (!initial) return <CatalogError />;
  const genreMap = Object.fromEntries(genres.map((g) => [g.id, g.name]));

  return (
    <>
      <PageHeader
        eyebrow="Discover"
        title="Movies"
        description="Fresh from TMDB — trending today, in cinemas now, all-time greats and what's coming next. Use filters to explore by genre, year, rating and language."
      />
      <div className="pt-8">
        <DiscoverBrowser
          kind="movie"
          initialTab="trending"
          genres={genres}
          genreMap={genreMap}
          initialData={initial}
        />
      </div>
    </>
  );
}
