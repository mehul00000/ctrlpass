'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export type IconAnimation =
  | 'draw'    // wipe reveal, left to right
  | 'spin'    // one full turn
  | 'pulse'   // soft scale
  | 'nudge-x' // slides right and back
  | 'ring';   // bell wobble

type Props = {
  icon: LucideIcon;
  animation: IconAnimation;
  /** 'hover' plays under a `.group` parent on hover/focus; 'always' plays once on mount */
  play?: 'hover' | 'always';
  /** change to replay an 'always' animation */
  replayKey?: string | number;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

const ANIM: Record<IconAnimation, string> = {
  draw: 'animated-icon-draw',
  spin: 'animated-icon-spin',
  pulse: 'animated-icon-pulse',
  'nudge-x': 'animated-icon-nudge-x',
  ring: 'animated-icon-ring',
};

/**
 * Lucide icon with a Hallmark-safe animation: transform / clip / opacity
 * only, and the global reduced-motion block collapses it to a static icon.
 * 'hover' mode animates when a `.group` control is hovered or focused.
 */
export default function AnimatedIcon({
  icon: Icon,
  animation,
  play = 'hover',
  replayKey,
  size = 16,
  strokeWidth = 2,
  className = '',
}: Props) {
  const playClass = play === 'always' ? 'is-playing' : '';

  return (
    <Icon
      aria-hidden="true"
      key={replayKey}
      size={size}
      strokeWidth={strokeWidth}
      className={`animated-icon ${ANIM[animation]} ${playClass} ${className}`}
    />
  );
}
