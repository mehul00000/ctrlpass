"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Check, Heart, Play, Share2, X } from "lucide-react";
import clsx from "clsx";
import { toStoreItem, useIsFavorite, useIsWatchlisted } from "@/lib/store-hooks";
import type { MediaType } from "@/lib/persistence";

interface Props {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath?: string | null;
  watchHref: string;
  trailerKey?: string | null;
}

export function DetailsActions({ id, mediaType, title, posterPath, backdropPath, watchHref, trailerKey }: Props) {
  const router = useRouter();
  const storeItem = toStoreItem({ id, mediaType, title, posterPath, backdropPath });
  const { inList, toggle: toggleList } = useIsWatchlisted(mediaType, id);
  const { isFav, toggle: toggleFav } = useIsFavorite(mediaType, id);
  const [shared, setShared] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `Watch ${title} on CtrlPass`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      /* user dismissed */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={() => router.push(watchHref)} className="btn-primary !px-7">
        <Play className="h-4 w-4 fill-current" />
        Watch Now
      </button>

      {trailerKey && (
        <button onClick={() => setTrailerOpen(true)} className="btn-secondary">
          <Play className="h-3 w-3" /> Official Trailer
        </button>
      )}

      <button
        onClick={() => toggleList(storeItem)}
        aria-pressed={inList}
        className={clsx("btn-secondary", inList && "!bg-brand-peach !text-brand-dark")}
      >
        {inList ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        {inList ? "In My List" : "My List"}
      </button>

      <button
        onClick={() => toggleFav(storeItem)}
        aria-pressed={isFav}
        className={clsx("btn-secondary", isFav && "!bg-brand-peach !text-brand-dark")}
      >
        <Heart className={clsx("h-4 w-4", isFav && "fill-current")} />
        {isFav ? "Favorited" : "Favorite"}
      </button>

      <button onClick={share} className="btn-secondary" aria-label="Share">
        {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        {shared ? "Link copied" : "Share"}
      </button>

      {/* Labeled trailer modal — clearly not the feature presentation */}
      {trailerOpen && trailerKey && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setTrailerOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-[#2b0008] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                Official Trailer — <span className="text-brand-peach">not the full feature</span>
              </p>
              <button
                onClick={() => setTrailerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Close trailer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                title={`${title} — official trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
