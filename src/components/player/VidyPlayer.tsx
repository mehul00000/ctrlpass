"use client";

// ---------------------------------------------------------------------------
// Vidy embed player — official integration per vidy.st docs:
//   - one iframe per watch page, allow="encrypted-media; autoplay *; fullscreen *"
//   - autoplay=true (user just clicked Watch Now — activation exists)
//   - progress=N resumes from stored watch history
//   - TV: nextEpisode / episodeSelector / autoplayNextEpisode provider controls
//   - PLAYER_EVENT postMessage → real progress tracking (Continue Watching)
//
// The provider may open its own ad tab (undocumented, not disableable — see
// README). Do not inject scripts into this cross-origin frame.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { vidyMovieEmbedUrl, vidyEpisodeEmbedUrl } from "@/lib/providers/vidy";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { MediaType } from "@/lib/persistence";
import { useCurrentUser } from "@/lib/user-context";

interface Props {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  season?: number;
  episode?: number;
}

interface VidyPlayerEventData {
  event?: string;
  currentTime?: number;
  timestamp?: number;
  duration?: number;
  progress?: number;
}

export function VidyPlayer({ mediaType, tmdbId, title, season, episode }: Props) {
  const { user } = useCurrentUser();
  const saveProgressMutation = useMutation(api.userData.upsertHistory);
  const resumeEntry = useQuery(
    api.userData.getHistoryEntry,
    user.signedIn ? { mediaType, tmdbId } : "skip"
  );
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSaveRef = useRef(0);

  // Resume from stored history, then build the embed URL with the documented
  // query flags.
  const url = useMemo(() => {
    const base =
      mediaType === "movie"
        ? vidyMovieEmbedUrl(tmdbId)
        : vidyEpisodeEmbedUrl(tmdbId, season ?? 1, episode ?? 1);
    const flags = new URLSearchParams();
    flags.set("autoplay", "true");
    if (resumeAt && resumeAt > 10) flags.set("progress", String(Math.floor(resumeAt)));
    if (mediaType === "tv") {
      flags.set("nextEpisode", "true");
      flags.set("episodeSelector", "true");
      flags.set("autoplayNextEpisode", "true");
    }
    return `${base}&${flags.toString()}`;
  }, [mediaType, tmdbId, season, episode, resumeAt]);

  // Watchdog: iframe onLoad never proving playability → offer retry.
  useEffect(() => {
    if (loaded) return;
    const t = setTimeout(() => setTimedOut(true), 20000);
    return () => clearTimeout(t);
  }, [loaded, url]);

  // Fetch the stored resume point for this title (or episode).
  useEffect(() => {
    const entry = resumeEntry;
    if (!entry || entry.completed) return;
    if (mediaType === "tv" && entry.seasonNumber !== undefined && entry.seasonNumber !== (season ?? 1)) return;
    if (entry.progress > 10) setResumeAt(entry.progress);
  }, [resumeEntry, mediaType, season]);

  // PLAYER_EVENT listener — persists real playback progress into history.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only accept messages from the embed itself (documented provider check).
      if (event.source !== iframeRef.current?.contentWindow) return;
      try {
        const host = new URL(event.origin).hostname;
        if (!host.endsWith("vidy.st")) return;
      } catch {
        return;
      }
      if (typeof event.data !== "string") return;

      let parsed: {
        type?: string;
        event?: string;
        currentTime?: number;
        timestamp?: number;
        duration?: number;
        progress?: number;
        data?: { event?: string; currentTime?: number; timestamp?: number; duration?: number; progress?: number };
      };
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }

      // Observed provider shapes:
      //   { type: "PLAYER_EVENT", data: { event, currentTime, duration, ... } }
      //   { event, currentTime, duration } (kept for compatibility)
      const data = parsed?.type === "PLAYER_EVENT" && parsed.data ? parsed.data : parsed;
      const evt = data?.event;
      if (evt !== "timeupdate" && evt !== "play" && evt !== "pause" && evt !== "ended") return;

      let currentTime = Math.max(0, Math.floor(Number(data?.currentTime ?? data?.timestamp) || 0));
      const duration = Math.max(0, Math.floor(Number(data?.duration) || 0));
      // Some payloads expose progress as a 0-100 percentage instead of seconds.
      if (!currentTime && typeof data?.progress === "number" && duration > 0) {
        currentTime = Math.floor((data.progress / 100) * duration);
      }

      const completed = evt === "ended" || (duration > 0 && currentTime / duration > 0.96);
      const now = Date.now();

      // Throttle saves to ~1 per 5s (except completion).
      if (!completed && now - lastSaveRef.current < 5000) return;
      lastSaveRef.current = now;

      saveProgressMutation({
        tmdbId,
        mediaType,
        title,
        posterPath: null,
        backdropPath: null,
        progress: currentTime,
        duration,
        completed,
        seasonNumber: mediaType === "tv" ? season ?? 1 : undefined,
        episodeNumber: mediaType === "tv" ? episode ?? 1 : undefined,
      });
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [saveProgressMutation, mediaType, tmdbId, title, season, episode]);

  return (
    <div className="h-full w-full">
      <div className="relative h-full w-full bg-black">
        {!loaded && !timedOut && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-peach border-t-transparent" />
              <p className="text-sm text-white">Loading {title}…</p>
            </div>
          </div>
        )}

        {timedOut && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/80 p-6 text-center">
            <div>
              <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-brand-peach" />
              <p className="mb-4 text-sm text-neutral-200">
                The player is taking longer than expected. This title may be unavailable right now.
              </p>
              <button onClick={() => window.location.reload()} className="btn-primary !py-2">
                <RotateCcw className="h-4 w-4" /> Retry
              </button>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          key={url}
          src={url}
          title={`Watch ${title}`}
          className="absolute inset-0 h-full w-full border-0"
          allow="encrypted-media; autoplay *; fullscreen *"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
