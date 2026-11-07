"use client";

import { useContinueWatching } from "@/lib/store-hooks";
import { ContinueWatchingRow } from "./States";

/**
 * Renders the personal "Continue Watching" row from the Convex backend,
 * independently of the server-rendered TMDB sections.
 */
export function ContinueWatchingSection() {
  const { items } = useContinueWatching();
  return <ContinueWatchingRow items={items} />;
}
