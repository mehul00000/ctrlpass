"use client";

import Link from "next/link";
import { Bookmark, Clock, Heart, ListVideo, LogIn, Settings, Tv } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentUser } from "@/lib/user-context";
import { useContinueWatching, useFavorites, useHistory, useWatchlistSet } from "@/lib/store-hooks";

export default function ProfilePage() {
  const { user } = useCurrentUser();
  const watchlist = useWatchlistSet();
  const favorites = useFavorites();
  const history = useHistory();
  const continueWatching = useContinueWatching();

  const isSynced = user.signedIn;

  return (
    <>
      <PageHeader eyebrow="Account" title="Profile" />

      <div className="container-page space-y-10 py-10">
        {/* Identity card */}
        <div className="flex flex-col items-start gap-6 rounded-3xl border border-white/5 bg-gradient-to-br from-brand-deep/30 to-transparent p-7 sm:flex-row sm:items-center">
          {user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt={user.name} className="h-20 w-20 rounded-2xl border border-white/15 object-cover" />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-2xl bg-brand font-display text-3xl font-bold text-white">
              {user.signedIn ? user.name.charAt(0).toUpperCase() : <LogIn className="h-8 w-8 text-brand-peach" />}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-bold text-white">
              {user.signedIn ? user.name : "Guest viewer"}
            </h2>
            <p className="mt-0.5 text-sm text-neutral-400">
              {user.signedIn ? user.email : "You're browsing in local mode"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip">
                {isSynced ? "Cloud sync active" : "Local device storage"}
              </span>
              <span className="chip">{user.mode === "clerk" ? "Clerk authentication" : "Local mode"}</span>
            </div>
          </div>
          {!user.signedIn && (
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="max-w-xs text-xs leading-relaxed text-neutral-400">
                Add your Clerk keys to <code className="rounded bg-white/10 px-1">.env.local</code> to enable
                sign-in, cloud sync and the admin dashboard.
              </p>
              <Link href="/sign-in" className="btn-primary !py-2 text-sm">
                <LogIn className="h-4 w-4" /> Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={Bookmark} label="In My List" value={watchlist.items?.length ?? 0} href="/my-list" />
          <StatCard icon={Heart} label="Favorites" value={favorites.items?.length ?? 0} href="/my-list" />
          <StatCard icon={Clock} label="Continue Watching" value={continueWatching.items?.length ?? 0} href="/my-list" />
          <StatCard icon={Tv} label="Titles Watched" value={history.items?.length ?? 0} href="/history" />
        </div>

        {/* Watch history preview */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">Watch History</h2>
            <Link href="/history" className="text-sm text-brand-peach hover:text-white">
              View all
            </Link>
          </div>
          {history.items.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center text-sm text-neutral-400">
              <ListVideo className="mx-auto mb-3 h-8 w-8 text-neutral-600" />
              Nothing watched yet — press play on anything to start tracking.
            </div>
          ) : (
            <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
              {(history.items ?? []).slice(0, 8).map((h) => (
                <li key={`${h.mediaType}-${h.tmdbId}`} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{h.title}</p>
                    <p className="text-xs text-neutral-500">
                      {h.seasonNumber !== undefined && h.episodeNumber !== undefined
                        ? `S${h.seasonNumber}:E${h.episodeNumber} · `
                        : ""}
                      {new Date(h.lastWatchedAt).toLocaleString()}
                      {h.completed ? " · finished" : ` · ${Math.round((h.progress / Math.max(h.duration, 1)) * 100)}%`}
                    </p>
                  </div>
                  <Link
                    href={`/watch/${h.mediaType}/${h.tmdbId}`}
                    className="btn-secondary !px-4 !py-1.5 text-xs"
                  >
                    Resume
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Settings teaser */}
        <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-white">
            <Settings className="h-5 w-5 text-brand-peach" /> Platform Status
          </h2>
          <ul className="grid gap-2 text-sm text-neutral-400 sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <StatusDot on /> TMDB metadata (active)
            </li>
            <li className="flex items-center gap-2">
              <StatusDot on={user.mode === "clerk"} /> Clerk authentication
            </li>
            <li className="flex items-center gap-2">
              <StatusDot on={true} /> Convex backend
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40"
    >
      <Icon className="h-5 w-5 text-brand-peach" />
      <p className="mt-3 font-display text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-neutral-400">{label}</p>
    </Link>
  );
}

function StatusDot({ on }: { on: boolean }) {
  return (
    <span
      className={`h-2 w-2 rounded-full ${on ? "bg-emerald-400" : "bg-neutral-600"}`}
      aria-hidden
    />
  );
}
