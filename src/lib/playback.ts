import "server-only";
import { playbackLookup, playbackUnavailable } from "./convex-server";

// ---------------------------------------------------------------------------
// Playback resolution — provider architecture.
//
// Priority:
//   1. Admin-configured file source (Convex `playbackSources`, curated in the
//      Admin Dashboard) — HLS or MP4 with full player features.
//   2. Seeded demo films (Creative Commons, correct-title matches) — full
//      playback through CtrlPass's own ad-free player.
//   3. Vidy embed (default provider) — attempted for every movie/TV episode.
//   4. Unavailable — honest error state with retry/report.
//
// A title marked unavailable in `playbackStatus` short-circuits the chain.
// Trailers are NEVER returned as playback.
// ---------------------------------------------------------------------------

export interface PlaybackSource {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  sourceType: "hls" | "mp4";
  videoUrl: string;
  availableQualities: string[];
  subtitleTracks: Array<{ label: string; srcLang: string; url: string }>;
  downloadEnabled: boolean;
  downloadUrl: string | null;
  rightsStatus: string;
  active: boolean;
  updatedAt: number;
}

export type ResolvedPlayback =
  | {
      kind: "file";
      sourceType: "hls" | "mp4";
      url: string;
      subtitles: Array<{ label: string; srcLang: string; url: string }>;
      rightsStatus: string;
      download?: { enabled: boolean; url: string | null };
      provider: string;
    }
  | { kind: "embed"; provider: string; url: string; rightsStatus: string }
  | { kind: "unavailable"; reason: string; provider: string };

export function isPlaybackConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CONVEX_URL && process.env.CONVEX_DEPLOY_KEY);
}

// --- seeded legal demo films (correct TMDB title ↔ correct film) -------------

const DEMO_SOURCES: PlaybackSource[] = [
  {
    id: "demo_movie_10378",
    tmdbId: 10378,
    mediaType: "movie",
    sourceType: "hls",
    videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    availableQualities: ["auto", "1080p", "720p", "480p"],
    subtitleTracks: [],
    downloadEnabled: false,
    downloadUrl: null,
    rightsStatus: "Creative Commons — Blender Foundation (Big Buck Bunny)",
    active: true,
    updatedAt: 0,
  },
  {
    id: "demo_movie_133701",
    tmdbId: 133701,
    mediaType: "movie",
    sourceType: "hls",
    videoUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    availableQualities: ["auto", "1080p", "720p", "480p"],
    subtitleTracks: [],
    downloadEnabled: false,
    downloadUrl: null,
    rightsStatus: "Creative Commons — Blender Foundation (Tears of Steel)",
    active: true,
    updatedAt: 0,
  },
];

function fileFromSource(source: PlaybackSource): ResolvedPlayback {
  return {
    kind: "file",
    sourceType: source.sourceType,
    url: source.videoUrl,
    subtitles: source.subtitleTracks,
    rightsStatus: source.rightsStatus,
    download: {
      enabled: source.downloadEnabled,
      url: source.downloadUrl,
    },
    provider: "admin-source",
  };
}

export async function resolvePlayback(
  mediaType: "movie" | "tv",
  tmdbId: number,
  season?: number,
  episode?: number
): Promise<ResolvedPlayback> {
  // Admin availability flag short-circuits the chain.
  let markedUnavailable = false;
  try {
    markedUnavailable = await playbackUnavailable(mediaType, tmdbId);
  } catch {
    /* Convex unreachable — continue down the chain */
  }
  if (markedUnavailable) {
    return {
      kind: "unavailable",
      reason: "This title was marked unavailable by an administrator.",
      provider: "admin",
    };
  }

  // 1. Admin-curated file source.
  try {
    const managed = await playbackLookup(mediaType, tmdbId);
    if (managed && managed.videoUrl && (managed.sourceType === "hls" || managed.sourceType === "mp4")) {
      return fileFromSource(managed as unknown as PlaybackSource);
    }
  } catch {
    /* fall through */
  }

  // 2. Seeded Creative Commons demo films (correct title, legal stream) —
  //    played through CtrlPass's own ad-free player.
  const demo = DEMO_SOURCES.find((s) => s.mediaType === mediaType && s.tmdbId === tmdbId);
  if (demo) return fileFromSource(demo);

  // 3. Vidy embed — the default provider for movies and TV episodes.
  const embedUrl =
    mediaType === "movie"
      ? `https://vidy.st/movie/${tmdbId}?color=CD1C18`
      : `https://vidy.st/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}?color=CD1C18`;
  return {
    kind: "embed",
    provider: "vidy",
    url: embedUrl,
    rightsStatus: "Provider-hosted embed",
  };
}

// Back-compat wrapper for callers that expect a PlaybackSource.
export async function getPlaybackSource(
  mediaType: "movie" | "tv",
  tmdbId: number,
  season?: number,
  episode?: number
): Promise<PlaybackSource | null> {
  const resolved = await resolvePlayback(mediaType, tmdbId, season, episode);
  if (resolved.kind !== "file") return null;
  return {
    id: "resolved",
    tmdbId,
    mediaType,
    sourceType: resolved.sourceType,
    videoUrl: resolved.url,
    availableQualities: [],
    subtitleTracks: resolved.subtitles,
    downloadEnabled: resolved.download?.enabled ?? false,
    downloadUrl: resolved.download?.url ?? null,
    rightsStatus: resolved.rightsStatus,
    active: true,
    updatedAt: Date.now(),
  };
}
