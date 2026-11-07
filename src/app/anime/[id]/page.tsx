import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getMovieDetails, getTVDetails } from "@/lib/tmdb";

/**
 * /anime/[tmdbId] — anime titles resolve to their real media type and forward
 * to the corresponding details page (anime movies → /movie, series → /tv).
 */
interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Anime" };
}

export default async function AnimeDetailsRedirect({ params }: Props) {
  const { id } = await params;
  const tmdbId = Number(id);
  if (!Number.isInteger(tmdbId)) notFound();

  const movie = await getMovieDetails(tmdbId).catch(() => null);
  // Movie details succeed even for shows only if the id happens to exist as a
  // movie — TMDB ids are namespaced per media type, so a TV id will 404 here.
  if (movie && (movie.genres.some((g) => g.id === 16) || movie.originalLanguage === "ja")) {
    redirect(`/movie/${tmdbId}`);
  }

  const show = await getTVDetails(tmdbId).catch(() => null);
  if (show) redirect(`/tv/${tmdbId}`);

  notFound();
}
