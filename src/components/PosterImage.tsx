"use client";

import Image from "next/image";
import { Film } from "lucide-react";
import clsx from "clsx";

const SIZE_TO_DIM: Record<string, { w: number; h: number }> = {
  w92: { w: 92, h: 138 },
  w154: { w: 154, h: 231 },
  w185: { w: 185, h: 278 },
  w342: { w: 342, h: 513 },
  w500: { w: 500, h: 750 },
  w780: { w: 780, h: 1170 },
};

/** Poster with graceful fallback when TMDB has no image. */
export function PosterImage({
  path,
  alt,
  size = "w342",
  className,
  sizes,
  priority = false,
}: {
  path: string | null | undefined;
  alt: string;
  size?: keyof typeof SIZE_TO_DIM;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const dim = SIZE_TO_DIM[size] ?? SIZE_TO_DIM.w342;
  const src = path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

  if (!src) {
    return (
      <div
        className={clsx(
          "grid place-items-center bg-gradient-to-br from-brand-deep/60 to-brand-dark",
          className
        )}
        aria-label={alt}
        role="img"
      >
        <Film className="h-8 w-8 text-brand-peach/50" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={dim.w}
      height={dim.h}
      sizes={sizes ?? `${dim.w}px`}
      priority={priority}
      className={className}
    />
  );
}

/** Backdrop with graceful fallback. */
export function BackdropImage({
  path,
  alt,
  className,
  priority = false,
  sizes = "100vw",
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (!path) {
    return (
      <div
        className={clsx("bg-gradient-to-br from-brand-deep to-brand-dark", className)}
        aria-label={alt}
        role="img"
      />
    );
  }
  return (
    <Image
      src={`https://image.tmdb.org/t/p/w1280${path}`}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );
}
