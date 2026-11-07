import type { Metadata } from "next";
import { getPopularTV, getTVGenres, getTrendingTV } from "@/lib/tmdb";
import { DiscoverBrowser } from "@/components/DiscoverBrowser";
import { PageHeader } from "@/components/PageHeader";
import { CatalogError } from "@/components/CatalogError";

export const metadata: Metadata = {
  title: "TV Shows",
  description: "Explore trending, popular and top-rated TV series with seasons, episodes and more.",
};

export const revalidate = 1800;

export default async function TVPage() {
  const [genres, initial] = await Promise.all([
    getTVGenres().catch(() => []),
    getTrendingTV("day").catch(() => null),
  ]);
  if (!initial) return <CatalogError />;
  const genreMap = Object.fromEntries(genres.map((g) => [g.id, g.name]));

  return (
    <>
      <PageHeader
        eyebrow="Discover"
        title="TV Shows"
        description="Binge-worthy series from around the world — trending now, airing today and the highest rated of all time."
      />
      <div className="pt-8">
        <DiscoverBrowser
          kind="tv"
          initialTab="trending"
          genres={genres}
          genreMap={genreMap}
          initialData={initial}
        />
      </div>
    </>
  );
}
