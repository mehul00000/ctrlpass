import type { Metadata } from "next";
import { getMovieGenres, getTopRatedAnime } from "@/lib/tmdb";
import { DiscoverBrowser } from "@/components/DiscoverBrowser";
import { PageHeader } from "@/components/PageHeader";
import { CatalogError } from "@/components/CatalogError";

export const metadata: Metadata = {
  title: "Anime",
  description: "Discover trending anime series and movies — from seasonal hits to timeless classics.",
};

export const revalidate = 1800;

export default async function AnimePage() {
  const [genres, initial] = await Promise.all([
    getMovieGenres().catch(() => []),
    getTopRatedAnime().catch(() => null),
  ]);
  if (!initial) return <CatalogError />;
  const genreMap = Object.fromEntries(genres.map((g) => [g.id, g.name]));

  return (
    <>
      <PageHeader
        eyebrow="Discover"
        title="Anime"
        description="Japanese animation at its best — seasonal series, feature films and critically acclaimed classics, discovered live from TMDB."
      />
      <div className="pt-8">
        <DiscoverBrowser
          kind="anime"
          initialTab="top"
          genres={genres}
          genreMap={genreMap}
          initialData={initial}
        />
      </div>
    </>
  );
}
