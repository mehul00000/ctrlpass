"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode, RefObject } from "react";

interface TimelineContentProps {
  as?: "div" | "p" | "span" | "h3" | "button";
  animationNum?: number;
  timelineRef?: RefObject<HTMLElement | null>;
  customVariants?: Variants;
  className?: string;
  children: ReactNode;
}

// Minimal stand-in for the registry's timeline-animation: plays customVariants
// (with animationNum as the custom index) when the element scrolls into view.
// shortcut: ignores timelineRef, reveals per-element instead of timeline-synced; upgrade if synced staggering is needed.
export function TimelineContent({
  as = "div",
  animationNum = 0,
  customVariants,
  className,
  children,
}: TimelineContentProps) {
  const Comp =
    as === "p"
      ? motion.p
      : as === "span"
        ? motion.span
        : as === "h3"
          ? motion.h3
          : as === "button"
            ? motion.button
            : motion.div;
  return (
    <Comp
      className={className}
      custom={animationNum}
      variants={customVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {children}
    </Comp>
  );
}
