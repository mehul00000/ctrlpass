"use client";

// ---------------------------------------------------------------------------
// CtrlPass cinema player — HLS + MP4 with professional controls.
// Plays ONLY authorized sources passed in from the server. When no licensed
// source exists for a title, the page falls back to the official trailer.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gauge, Languages, Maximize, Minimize, Pause, PictureInPicture2, Play, RotateCcw, Settings, SkipForward, Volume1, Volume2, VolumeX } from "lucide-react";
import clsx from "clsx";
import Hls from "hls.js";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { MediaType } from "@/lib/persistence";
import { useCurrentUser } from "@/lib/user-context";

export interface PlayerSource {
  kind: "hls" | "mp4";
  url: string;
  subtitles: Array<{ label: string; srcLang: string; url: string }>;
}

export interface PlayerEpisode {
  seasonNumber: number;
  episodeNumber: number;
  name: string;
}

interface Props {
  source: PlayerSource;
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  subtitle?: string | null; // e.g. S1:E4 — Episode Name
  backdropPath: string | null;
  episodes: PlayerEpisode[];
  nextHref: string | null;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function fmt(t: number): string {
  if (!Number.isFinite(t)) return "0:00";
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoPlayer({
  source,
  mediaType,
  tmdbId,
  title,
  subtitle,
  backdropPath,
  episodes,
  nextHref,
}: Props) {
  const { user } = useCurrentUser();
  const saveProgressMutation = useMutation(api.userData.upsertHistory);
  const resumeEntry = useQuery(
    api.userData.getHistoryEntry,
    user.signedIn ? { mediaType, tmdbId } : "skip"
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedProgress = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [menu, setMenu] = useState<null | "settings">(null);
  const [levels, setLevels] = useState<Array<{ index: number; label: string }>>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeOffer, setResumeOffer] = useState<number | null>(null);
  const [nextOverlay, setNextOverlay] = useState(false);

  const currentEpisode = useMemo(
    () => episodes.find((e) => `${e.seasonNumber}:${e.episodeNumber}` === subtitle?.split(" ")[0]),
    [episodes, subtitle]
  );

  // --- attach source (HLS via hls.js, MP4 native) ---------------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;

    const attach = async () => {
      if (source.kind === "hls") {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source.url; // Safari native HLS
        } else if (Hls.isSupported()) {
          const hls = new Hls({ capLevelToPlayerSize: true });
          hlsRef.current = hls;
          hls.loadSource(source.url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
            if (cancelled) return;
            setLevels(
              data.levels.map((l, index) => ({
                index,
                label: l.height ? `${l.height}p` : `${Math.round((l.bitrate ?? 0) / 1000)}kbps`,
              }))
            );
          });
          hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
            if (cancelled) return;
            setCurrentLevel(hls.autoLevelEnabled ? -1 : data.level);
          });
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (!cancelled && data.fatal) {
              setError("Stream error — the source may be offline. Try again or pick another quality.");
            }
          });
        } else {
          setError("HLS playback is not supported in this browser.");
        }
      } else {
        video.src = source.url;
      }
    };

    attach();
    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [source]);

  // --- resume ---------------------------------------------------------------
  useEffect(() => {
    const entry = resumeEntry;
    if (!entry || entry.completed) return;
    if (entry.seasonNumber !== undefined && currentEpisode && entry.seasonNumber !== currentEpisode.seasonNumber) return;
    if (entry.progress > 10) setResumeOffer(entry.progress);
  }, [resumeEntry, currentEpisode]);

  // --- progress persistence --------------------------------------------------
  const persist = useCallback(
    (progress: number, dur: number, completed: boolean) => {
      if (dur <= 0 || progress <= 0) return;
      saveProgressMutation({
        tmdbId,
        mediaType,
        title,
        posterPath: null,
        backdropPath,
        progress: Math.floor(progress),
        duration: Math.floor(dur),
        completed,
        seasonNumber: currentEpisode?.seasonNumber,
        episodeNumber: currentEpisode?.episodeNumber,
      });
    },
    [saveProgressMutation, mediaType, tmdbId, title, backdropPath, currentEpisode]
  );

  useEffect(() => {
    const id = setInterval(() => {
      const v = videoRef.current;
      if (v && !v.paused && v.duration > 0) {
        savedProgress.current = v.currentTime;
        persist(v.currentTime, v.duration, v.currentTime / v.duration > 0.96);
      }
    }, 5000);
    return () => {
      clearInterval(id);
      const v = videoRef.current;
      if (v && v.duration > 0) persist(v.currentTime, v.duration, v.currentTime / v.duration > 0.96);
    };
  }, [persist]);

  // --- ui helpers -------------------------------------------------------------
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => setError("Playback was blocked. Interact with the page and try again."));
    else v.pause();
  }, []);

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.min(Math.max(0, v.currentTime + delta), v.duration || 0);
  }, []);

  const changeVolume = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }, []);

  const togglePip = useCallback(async () => {
    const v = videoRef.current as (HTMLVideoElement & { requestPictureInPicture?: () => Promise<void> }) | null;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {
      /* unsupported */
    }
  }, []);

  // --- video events -----------------------------------------------------------
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoaded = () => {
      setDuration(v.duration);
      setReady(true);
      if (resumeOffer && resumeOffer < v.duration * 0.96) {
        v.currentTime = resumeOffer;
        setResumeOffer(null);
      }
    };
    const onTime = () => {
      setTime(v.currentTime);
      if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
      const remain = v.duration - v.currentTime;
      setNextOverlay(nextHref !== null && remain > 0 && remain < 20);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      if (v.duration > 0) persist(v.currentTime, v.duration, false);
    };
    const onEnded = () => {
      if (v.duration > 0) persist(v.duration, v.duration, true);
      setNextOverlay(nextHref !== null);
    };
    const onVolume = () => {
      setVolume(v.volume);
      setMuted(v.muted);
    };

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("volumechange", onVolume);
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("volumechange", onVolume);
    };
  }, [persist, resumeOffer, nextHref]);

  // --- keyboard shortcuts -------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowright":
          seekBy(10);
          break;
        case "arrowleft":
          seekBy(-10);
          break;
        case "arrowup":
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;
        case "arrowdown":
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;
        case "m":
          setMuted((m) => {
            const v = videoRef.current;
            if (v) v.muted = !m;
            return !m;
          });
          break;
        case "f":
          toggleFullscreen();
          break;
        case "p":
          togglePip();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seekBy, changeVolume, volume, toggleFullscreen, togglePip]);

  // --- auto-hide controls ---------------------------------------------------------
  const bumpControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const setHlsLevel = (index: number) => {
    const hls = hlsRef.current;
    if (hls) {
      hls.currentLevel = index;
      setCurrentLevel(index === -1 ? -1 : index);
    }
    setMenu(null);
  };

  const setSubtitle = (srcLang: string | null) => {
    const v = videoRef.current;
    if (!v) return;
    Array.from(v.textTracks).forEach((t) => {
      t.mode = t.language === srcLang ? "showing" : "disabled";
    });
    setActiveSubtitle(srcLang);
    setMenu(null);
  };

  const changeSpeed = (s: number) => {
    const v = videoRef.current;
    if (v) v.playbackRate = s;
    setSpeed(s);
    setMenu(null);
  };

  const seekPct = duration > 0 ? (time / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={bumpControls}
      onMouseLeave={() => playing && setShowControls(false)}
      className={clsx(
        "group relative w-full overflow-hidden bg-black",
        fullscreen ? "h-screen" : "aspect-video max-h-[82vh] rounded-2xl"
      )}
    >
      <video
        ref={videoRef}
        playsInline
        className="h-full w-full"
        onClick={togglePlay}
        crossOrigin="anonymous"
      >
        {source.subtitles.map((s) => (
          <track key={s.srcLang} kind="subtitles" label={s.label} srcLang={s.srcLang} src={s.url} />
        ))}
      </video>

      {/* Loading / error / resume overlays */}
      {!ready && !error && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/70 p-6 text-center">
          <div>
            <p className="mb-3 text-sm text-neutral-200">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary !py-2">
              <RotateCcw className="h-4 w-4" /> Reload
            </button>
          </div>
        </div>
      )}
      {resumeOffer !== null && ready && (
        <div className="absolute inset-0 grid place-items-center bg-black/60">
          <div className="rounded-2xl border border-white/10 bg-[#2b0008]/95 p-6 text-center shadow-2xl">
            <p className="mb-1 font-display text-lg font-semibold text-white">Resume watching?</p>
            <p className="mb-4 text-sm text-neutral-400">
              You stopped at {fmt(resumeOffer)}.
            </p>
            <div className="flex gap-3">
              <button
                className="btn-primary !py-2"
                onClick={() => {
                  const v = videoRef.current;
                  if (v) v.currentTime = resumeOffer;
                  setResumeOffer(null);
                  v?.play();
                }}
              >
                Resume
              </button>
              <button className="btn-secondary !py-2" onClick={() => setResumeOffer(null)}>
                Start over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Big play */}
      {ready && !playing && !error && !resumeOffer && (
        <button
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 grid place-items-center"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full bg-brand/90 shadow-glow transition-transform hover:scale-110">
            <Play className="h-8 w-8 translate-x-0.5 fill-current text-white" />
          </span>
        </button>
      )}

      {/* Next episode overlay */}
      {nextOverlay && nextHref && (
        <div className="absolute bottom-24 right-6 z-20 rounded-2xl border border-white/10 bg-[#2b0008]/95 p-4 shadow-2xl">
          <p className="text-sm font-semibold text-white">Up next</p>
          <p className="mb-3 text-xs text-neutral-400">Continue to the next episode</p>
          <div className="flex gap-2">
            <Link href={nextHref} className="btn-primary !px-4 !py-2 text-xs">
              <SkipForward className="h-3.5 w-3.5" /> Play next
            </Link>
            <button onClick={() => setNextOverlay(false)} className="btn-secondary !px-4 !py-2 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div
        className={clsx(
          "absolute inset-x-0 top-0 z-10 flex items-center gap-3 bg-gradient-to-b from-black/70 to-transparent p-4 transition-opacity",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <Link href={`/${mediaType}/${tmdbId}`} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Back to details">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{title}</p>
          {subtitle && <p className="truncate text-xs text-neutral-300">{subtitle}</p>}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className={clsx(
          "absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-3 pt-10 transition-opacity",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Seek bar */}
        <div
          className="group/seek relative mb-2 h-4 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const v = videoRef.current;
            if (v && duration) v.currentTime = pct * duration;
          }}
        >
          <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white/30" style={{ width: `${bufPct}%` }} />
          </div>
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand transition-[height] group-hover/seek:h-1.5"
            style={{ width: `${seekPct}%` }}
          >
            <span className="absolute -right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-brand-peach opacity-0 transition-opacity group-hover/seek:opacity-100" />
          </div>
        </div>

        <div className="flex items-center gap-3 text-white">
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="transition-transform hover:scale-110">
            {playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
          </button>

          <div className="group/vol flex items-center gap-1.5">
            <button onClick={() => changeVolume(muted ? 1 : 0)} aria-label="Mute">
              {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : volume < 0.5 ? <Volume1 className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              aria-label="Volume"
              className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30 opacity-0 transition-all duration-200 group-hover/vol:w-20 group-hover/vol:opacity-100 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-peach"
            />
          </div>

          <span className="text-xs tabular-nums text-neutral-300">
            {fmt(time)} <span className="text-neutral-500">/ {fmt(duration)}</span>
          </span>

          <div className="ml-auto flex items-center gap-2">
            {/* Settings menu */}
            <div className="relative">
              <button
                onClick={() => setMenu(menu ? null : "settings")}
                aria-label="Settings"
                className={clsx("grid h-9 w-9 place-items-center rounded-full transition-colors", menu ? "bg-brand" : "hover:bg-white/15")}
              >
                <Settings className="h-4.5 w-4.5" />
              </button>
              {menu === "settings" && (
                <div className="absolute bottom-12 right-0 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#2b0008]/97 p-1.5 text-sm shadow-2xl">
                  {levels.length > 0 && (
                    <MenuGroup label="Quality">
                      <MenuItem selected={currentLevel === -1} onClick={() => setHlsLevel(-1)}>
                        Auto
                      </MenuItem>
                      {[...levels].reverse().map((l) => (
                        <MenuItem key={l.index} selected={currentLevel === l.index} onClick={() => setHlsLevel(l.index)}>
                          {l.label}
                        </MenuItem>
                      ))}
                    </MenuGroup>
                  )}
                  {source.subtitles.length > 0 && (
                    <MenuGroup label="Subtitles">
                      <MenuItem selected={activeSubtitle === null} onClick={() => setSubtitle(null)}>
                        Off
                      </MenuItem>
                      {source.subtitles.map((s) => (
                        <MenuItem key={s.srcLang} selected={activeSubtitle === s.srcLang} onClick={() => setSubtitle(s.srcLang)}>
                          {s.label}
                        </MenuItem>
                      ))}
                    </MenuGroup>
                  )}
                  <MenuGroup label="Speed">
                    {SPEEDS.map((s) => (
                      <MenuItem key={s} selected={speed === s} onClick={() => changeSpeed(s)}>
                        {s === 1 ? "Normal" : `${s}×`}
                      </MenuItem>
                    ))}
                  </MenuGroup>
                </div>
              )}
            </div>

            <button onClick={togglePip} aria-label="Picture in picture" className="hidden h-9 w-9 place-items-center rounded-full hover:bg-white/15 sm:grid">
              <PictureInPicture2 className="h-4 w-4" />
            </button>
            <button onClick={toggleFullscreen} aria-label="Fullscreen" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15">
              {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/5 py-1.5 last:border-0">
      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      {children}
    </div>
  );
}

function MenuItem({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5",
        selected ? "text-brand-peach" : "text-neutral-300"
      )}
    >
      {children}
      {selected && <Gauge className="h-3.5 w-3.5" />}
    </button>
  );
}

/** Official-trailer fallback (authorized public YouTube embed). */
export function TrailerPlayer({
  youtubeKey,
  title,
  backdropPath,
}: {
  youtubeKey: string;
  title: string;
  backdropPath: string | null;
}) {
  return (
    <div className="w-full">
      <div className="relative aspect-video max-h-[82vh] w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&rel=0&modestbranding=1`}
          title={`${title} — official trailer`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <div className="mt-4 rounded-xl border border-brand-peach/20 bg-brand-deep/20 px-4 py-3 text-sm text-neutral-300">
        You’re watching the <span className="font-semibold text-brand-peach">official trailer</span>.
        Full-feature playback becomes available once an authorized video source is configured for this
        title in the Admin Dashboard.
      </div>
    </div>
  );
}
