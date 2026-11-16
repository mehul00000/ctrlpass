'use client';

import Image from 'next/image';
import { useState } from 'react';

/* Library fallback (Wikimedia Commons, Ian T. McFarland, CC BY-SA 2.0),
   credited in the footer. */
const EVENT_FALLBACK = '/photos/lights-2011-04-24-by-ian-t-mcfarland-1920.jpg';

type EventImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  aspectClassName?: string;
  priority?: boolean;
};

export default function EventImage({
  src,
  alt,
  className = '',
  aspectClassName = 'aspect-[16/9]',
  priority = false,
}: EventImageProps) {
  const [failed, setFailed] = useState(false);

  const imageSrc =
    src && !failed ? src : EVENT_FALLBACK;

  const usingFallback = !src || failed;

  return (
    <div
      className={`relative overflow-hidden bg-[color:var(--color-paper-3)] ${aspectClassName} ${className}`}
    >
      <Image
        src={imageSrc}
        alt={usingFallback ? '' : alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        className="object-cover"
        onError={() => {
          if (!usingFallback) {
            setFailed(true);
          }
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--color-paper)]/25 via-transparent to-transparent" />
    </div>
  );
}