"use client";

import Link from "next/link";
import { History, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/States";
import type { HistoryItem } from "@/lib/persistence";

export default function HistoryPage() {
  const result = useQuery(api.userData.listHistory);
  const items = (result ?? []) as HistoryItem[];
  const removeEntry = useMutation(api.userData.removeHistory);
  const loading = result === undefined;

  return (
    <>
      <PageHeader
        eyebrow="Your Library"
        title="Watch History"
        description="Everything you've watched on CtrlPass, with resume points."
      />
      <div className="container-page py-10">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={History}
            title="No watch history yet"
            description="Titles you play will be tracked here automatically."
            actionLabel="Browse Movies"
            actionHref="/movies"
          />
        ) : (
          <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
            {items.map((h) => (
              <li key={h._id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <Link
                    href={`/${h.mediaType}/${h.tmdbId}`}
                    className="truncate text-sm font-medium text-white hover:text-brand-peach"
                  >
                    {h.title}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    {h.seasonNumber !== undefined && h.episodeNumber !== undefined
                      ? `S${h.seasonNumber}:E${h.episodeNumber} · `
                      : ""}
                    {new Date(h.lastWatchedAt).toLocaleString()}
                    {h.completed
                      ? " · finished"
                      : ` · ${Math.round((h.progress / Math.max(h.duration, 1)) * 100)}% watched`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/watch/${h.mediaType}/${h.tmdbId}`} className="btn-primary !px-4 !py-1.5 text-xs">
                    {h.completed ? "Rewatch" : "Resume"}
                  </Link>
                  <button
                    onClick={() => removeEntry({ mediaType: h.mediaType, tmdbId: h.tmdbId })}
                    aria-label={`Remove ${h.title} from history`}
                    className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-brand/20 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
