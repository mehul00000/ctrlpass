// ---------------------------------------------------------------------------
// Vidy playback provider — the default embed provider for movies and TV
// episodes. Embed URLs are constructed from TMDB IDs per Vidy's documented
// format. Availability is provider-side: an embed is always "attemptable",
// and failures surface as an unavailable state (never a substituted video).
// ---------------------------------------------------------------------------

const VIDY_COLOR = "CD1C18";

export function vidyMovieEmbedUrl(tmdbId: number): string {
  return `https://vidy.st/movie/${tmdbId}?color=${VIDY_COLOR}`;
}

export function vidyEpisodeEmbedUrl(
  tmdbId: number,
  season: number,
  episode: number
): string {
  return `https://vidy.st/tv/${tmdbId}/${season}/${episode}?color=${VIDY_COLOR}`;
}

export const VIDY_PROVIDER_NAME = "vidy";
