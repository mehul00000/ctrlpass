"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Ghost,
  ListVideo,
  Play,
  RefreshCcw,
  SearchX,
} from "lucide-react";
import { ProgressLinkCard } from "./ProgressLinkCard";
import type { HistoryItem } from "@/lib/persistence";

export function EmptyState({
  icon: Icon = Ghost,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-white/5 bg-white/[0.02] px-8 py-14 text-center"
    >
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-deep to-brand-dark">
        <Icon className="h-7 w-7 text-brand-peach" />
      </div>
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      {description && <p className="mt-2 text-sm leading-relaxed text-neutral-400">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary mt-6">
          {actionLabel}
        </Link>
      )}
    </motion.div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-brand/20 bg-brand/5 px-8 py-12 text-center">
      <AlertTriangle className="mb-4 h-10 w-10 text-brand-peach" />
      <h3 className="font-display text-lg font-semibold text-white">Something went wrong</h3>
      <p className="mt-2 text-sm text-neutral-400">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-6">
          <RefreshCcw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}

export function NoSearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={SearchX}
      title={`No results for "${query}"`}
      description="Check the spelling or try a different title, person or genre."
    />
  );
}

export function EmptyMyList() {
  return (
    <EmptyState
      icon={ListVideo}
      title="Your list is empty"
      description="Save movies and shows you want to watch by tapping the bookmark icon on any poster."
      actionLabel="Browse Movies"
      actionHref="/movies"
    />
  );
}

export function ContinueWatchingRow({ items }: { items: HistoryItem[] }) {
  if (!items.length) return null;
  return (
    <section>
      <div className="container-page mb-4">
        <h2 className="section-title">
          Continue Watching
          <span className="mt-1.5 block h-1 w-10 rounded-full bg-brand" />
        </h2>
      </div>
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-2 sm:px-6 lg:px-10">
        {items.map((h) => (
          <ProgressLinkCard key={`${h.mediaType}-${h.tmdbId}`} entry={h} />
        ))}
      </div>
    </section>
  );
}

export function ResumeButton({ entry }: { entry: HistoryItem }) {
  const pct = entry.duration > 0 ? Math.round((entry.progress / entry.duration) * 100) : 0;
  return (
    <div className="w-full">
      <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
        <Play className="h-3 w-3" /> {pct}% watched
        {entry.seasonNumber !== undefined && entry.episodeNumber !== undefined
          ? ` · S${entry.seasonNumber}:E${entry.episodeNumber}`
          : ""}
      </span>
    </div>
  );
}
