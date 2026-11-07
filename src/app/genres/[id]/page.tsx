import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDiscoverMovies, getDiscoverTV, getMovieGenres, getTVGenres } from "@/lib/tmdb";
import type { Genre } from "@/lib/tmdb-types";
import { DiscoverBrowser } from "@/components/DiscoverBrowser";
import { PageHeader } from "@/components/PageHeader";
import { CatalogError } from "@/components/CatalogError";

export const revalidate = 1800;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const genres = await getMovieGenres();
  const genre = genres.find((g) => String(g.id) === id);
  return { title: genre ? `${genre.name} Movies & Shows` : "Genre" };
}

export default async function GenrePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { type } = await searchParams;
  const genreId = Number(id);
  if (!Number.isInteger(genreId)) notFound();

  const mediaType = type === "tv" ? "tv" : "movie";

  const [movieGenres, tvGenres] = await Promise.all([
    getMovieGenres().catch(() => [] as Genre[]),
    getTVGenres().catch(() => [] as Genre[]),
  ]);
  const all = [...movieGenres, ...tvGenres];
  const genre = all.find((g) => g.id === genreId);
  if (!genre) notFound();

  const genreMap = Object.fromEntries(all.map((g) => [g.id, g.name]));

  const initial =
    mediaType === "movie"
      ? await getDiscoverMovies({ genre: genreId, minVotes: 40 }).catch(() => null)
      : await getDiscoverTV({ genre: genreId, minVotes: 40 }).catch(() => null);

  if (!initial) return <CatalogError />;

  const hasTVVariant = tvGenres.some((g) => g.id === genreId);
  const hasMovieVariant = movieGenres.some((g) => g.id === genreId);

  return (
    <>
      <PageHeader
        eyebrow="Genre"
        title={`${genre.name} ${mediaType === "movie" ? "Movies" : "Shows"}`}
        description={`Everything in the ${genre.name.toLowerCase()} category, pulled live from TMDB. Filter by year, rating, language and more.`}
      >
        <div className="mt-5 flex items-center gap-3">
          <Link
            href="/genres"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All genres
          </Link>
          {hasMovieVariant && hasTVVariant && (
            <div className="flex overflow-hidden rounded-full border border-white/10">
              <Link
                href={`/genres/${genreId}?type=movie`}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  mediaType === "movie" ? "bg-brand text-white" : "text-neutral-300 hover:bg-white/5"
                }`}
              >
                Movies
              </Link>
              <Link
                href={`/genres/${genreId}?type=tv`}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  mediaType === "tv" ? "bg-brand text-white" : "text-neutral-300 hover:bg-white/5"
                }`}
              >
                TV Shows
              </Link>
            </div>
          )}
        </div>
      </PageHeader>
      <div className="pt-8">
        <DiscoverBrowser
          kind={mediaType}
          initialTab="discover"
          genres={mediaType === "movie" ? movieGenres : tvGenres}
          genreMap={genreMap}
          initialData={initial}
          lockGenre={String(genreId)}
        />
      </div>
    </>
  );
}
