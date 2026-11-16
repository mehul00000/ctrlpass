'use client';

import Image from 'next/image';
import Link from 'next/link';
import { brandAssets } from '@/lib/brand';

type BrandMarkProps = {
  href?: string | null;
  size?: number;
  showWordmark?: boolean;
  compact?: boolean;
  accentClassName?: string;
  variant?: 'mark' | 'app';
};

export default function BrandMark({
  href = '/',
  size = 40,
  showWordmark = true,
  compact = false,
  accentClassName = 'text-[color:var(--color-accent)]',
  variant = 'mark',
}: BrandMarkProps) {
  const mark = (
    <span className="group flex items-center gap-3">
      <span
        className="relative shrink-0 overflow-hidden rounded-xl border border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]"
        style={{ width: size, height: size }}
      >
        <Image
          src={variant === 'app' ? brandAssets.appIcon : brandAssets.logo}
          alt="CtrlPass"
          fill
          sizes={`${size}px`}
          className="object-cover"
          priority
        />
      </span>

      {showWordmark && (
        <span className="min-w-0">
          <span className="block font-display text-2xl font-medium leading-none tracking-[-0.04em] text-[color:var(--color-ink)]">
            CTRL
            <span className={accentClassName}>PASS</span>
          </span>
        </span>
      )}
    </span>
  );

  if (!href) {
    return mark;
  }

  return (
    <Link
      href={href}
      aria-label="CtrlPass home"
      className="rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)]"
    >
      {mark}
    </Link>
  );
}