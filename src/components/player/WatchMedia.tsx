import Link from "next/link";
import { redirect } from "next/navigation";
import { getMovieDetails, getSeasonDetails, getTVDetails } from "@/lib/tmdb";
import { resolvePlayback } from "@/lib/playback";
import { getAuthContext } from "@/lib/auth-guard";
import { VideoPlayer, type PlayerEpisode } from "./VideoPlayer";
import { VidyPlayer } from "./VidyPlayer";
import { CinemaHud } from "./CinemaHud";
import { UnavailablePanel } from "./UnavailablePanel";
import { CatalogError } from "@/components/CatalogError";

// ---------------------------------------------------------------------------
// Shared watch experience (server component).
//
// Playback resolution: admin-configured source → Vidy embed (default
// provider) → seeded Creative Commons demos → honest unavailable state.
// Trailers are never substituted for the actual title.
// ---------------------------------------------------------------------------

interface Props {
  type: "movie" | "tv";
  tmdbId: number;
  season?: number;
  episode?: number;
}

export default async function WatchMedia({ type, tmdbId, season, episode }: Props) {
  const backHref = `/${type}/${tmdbId}`;
  const watchHref =
    type === "tv"
      ? `/watch/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}`
      : `/watch/movie/${tmdbId}`;

  // Playback requires a signed-in account once Clerk is configured.
  const auth = await getAuthContext();
  if (!auth.ok && auth.status === 401) {
    redirect(`/sign-in?redirect=${encodeURIComponent(watchHref)}`);
  }

  const seasonNum = season ?? 1;
  const episodeNum = episode ?? 1;

  let title = "";
  let year: string | null = null;
  let genreNames: string[] = [];
  let overview = "";
  let backdropPath: string | null = null;
  let seasons: Array<{ id: number; name: string; seasonNumber: number; episodeCount: number; posterPath: string | null; airDate: string | null; overview: string }> = [];
  let episodes: PlayerEpisode[] = [];
  let subtitle: string | null = null;
  let prevHref: string | null = null;
  let nextHref: string | null = null;

  if (type === "movie") {
    const movie = await getMovieDetails(tmdbId).catch(() => null);
    if (!movie) return <CatalogError />;
    title = movie.title;
    year = movie.releaseDate?.slice(0, 4) ?? null;
    genreNames = movie.genres.map((g) => g.name);
    overview = movie.overview;
    backdropPath = movie.backdropPath;
  } else {
    const show = await getTVDetails(tmdbId).catch(() => null);
    if (!show) return <CatalogError />;
    title = show.title;
    year = show.releaseDate?.slice(0, 4) ?? null;
    genreNames = show.genres.map((g) => g.name);
    overview = show.overview;
    backdropPath = show.backdropPath;
    seasons = show.seasons;

    const seasonData = await getSeasonDetails(tmdbId, seasonNum).catch(() => null);
    episodes = (seasonData?.episodes ?? []).map((e) => ({
      seasonNumber: e.seasonNumber,
      episodeNumber: e.episodeNumber,
      name: e.name,
    }));
    const idx = episodes.findIndex((e) => e.episodeNumber === episodeNum);
    const prev = idx > 0 ? episodes[idx - 1] : null;
    const next = idx >= 0 ? episodes[idx + 1] : null;
    subtitle = `S${seasonNum}:E${episodeNum}${episodes[idx] ? ` — ${episodes[idx].name}` : ""}`;
    prevHref = prev ? `/watch/tv/${tmdbId}/${prev.seasonNumber}/${prev.episodeNumber}` : null;
    nextHref = next ? `/watch/tv/${tmdbId}/${next.seasonNumber}/${next.episodeNumber}` : null;
  }

  const resolved = await resolvePlayback(type, tmdbId, seasonNum, episodeNum);

  return (
    <div className="min-h-screen bg-black pb-16">
      <div className="mx-auto w-full max-w-[1500px] px-3 pt-6 sm:px-6">
        {resolved.kind === "file" && (
          <VideoPlayer
            source={{
              kind: resolved.sourceType,
              url: resolved.url,
              subtitles: resolved.subtitles,
            }}
            mediaType={type}
            tmdbId={tmdbId}
            title={title}
            subtitle={subtitle}
            backdropPath={backdropPath}
            episodes={episodes}
            nextHref={nextHref}
          />
        )}

        {resolved.kind === "embed" && (
          <div className="fixed inset-0 z-[70] bg-black">
            <VidyPlayer
              mediaType={type}
              tmdbId={tmdbId}
              title={title}
              season={type === "tv" ? seasonNum : undefined}
              episode={type === "tv" ? episodeNum : undefined}
            />
            <CinemaHud
              backHref={backHref}
              title={title}
              isTv={type === "tv"}
              prevHref={prevHref}
              nextHref={nextHref}
              seasons={seasons}
              tvId={tmdbId}
            />
          </div>
        )}

        {resolved.kind === "unavailable" && (
          <UnavailablePanel
            reason={resolved.reason}
            backHref={backHref}
            tmdbId={tmdbId}
            mediaType={type}
          />
        )}
      </div>
    </div>
  );
}
