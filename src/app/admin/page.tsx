"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  Film,
  Flag,
  ListChecks,
  Plus,
  RefreshCcw,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
  Users as UsersIcon,
  Zap,
} from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/States";
import { useCurrentUser } from "@/lib/user-context";

const TABS = ["Overview", "Sources", "Sync", "Users", "Reports"] as const;
type Tab = (typeof TABS)[number];

interface Overview {
  tmdbConfigured: boolean;
  convexConfigured: boolean;
  store?: "admin-sdk" | "client-sdk" | null;
  reason?: string | null;
  database?: {
    users: number;
    watchlistEntries: number;
    historyRecords: number;
    sources: number;
    activeSources: number;
    reports: number;
  } | null;
}

interface Source {
  id: string;
  tmdbId: number;
  mediaType: string;
  sourceType: string;
  videoUrl: string;
  rightsStatus?: string;
  downloadEnabled?: boolean;
  active?: boolean;
}

interface AdminUser {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}

interface Report {
  id: string;
  tmdbId?: number;
  mediaType?: string;
  issueType?: string;
  description?: string;
  status?: string;
  createdAt?: number;
}

export default function AdminPage() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState<Tab>("Overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, s] = await Promise.all([
        fetch("/api/admin/overview").then((r) => r.json()),
        fetch("/api/admin/sources").then((r) => r.json()),
      ]);
      if (o.error) throw new Error(o.error);
      setOverview(o);
      setSources(s.sources ?? []);
      if (o.database) {
        const [u, r] = await Promise.all([
          fetch("/api/admin/users").then((x) => x.json()),
          fetch("/api/admin/reports").then((x) => x.json()),
        ]);
        setUsers(u.users ?? []);
        setReports(r.reports ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dbReady = overview?.convexConfigured;

  return (
    <>
      <PageHeader
        eyebrow="Control Center"
        title="Admin Dashboard"
        description="Manage authorized playback sources, users and reports. Every action is validated server-side."
      >
        <div className="mt-5 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                tab === t ? "bg-brand text-white shadow-glow" : "bg-white/5 text-neutral-300 hover:bg-white/10"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="container-page py-10">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={ShieldCheck}
            title={user.signedIn ? "This account doesn't have admin access" : "Sign in required"}
            description={
              user.signedIn
                ? `You're signed in as ${user.email || "an unrecognized account"}. Admin access is restricted to the owner's email (ADMIN_EMAILS). Sign in with that account to open the Control Center.`
                : error
            }
            actionLabel={user.signedIn ? "Switch Account" : "Sign In"}
            actionHref={user.signedIn ? "/sign-in" : "/sign-in?redirect=%2Fadmin"}
          />
        ) : (
          <div className="space-y-8">
            {!dbReady && (
              <div className="rounded-2xl border border-brand-peach/25 bg-brand-deep/15 p-5">
                <h3 className="flex items-center gap-2 font-display text-base font-semibold text-white">
                  <Database className="h-5 w-5 text-brand-peach" /> Convex not connected
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                  Add these to <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs">.env.local</code>{" "}
                  and restart:
                </p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-neutral-300">
{`NEXT_PUBLIC_CONVEX_URL=https://tangible-hedgehog-929.convex.cloud
CONVEX_DEPLOY_KEY=dev:...`}
                </pre>
              </div>
            )}
            {tab === "Overview" && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard icon={UsersIcon} label="Registered Users" value={overview?.database?.users} />
                <StatCard icon={ListChecks} label="Watchlist Entries" value={overview?.database?.watchlistEntries} />
                <StatCard icon={Zap} label="History Records" value={overview?.database?.historyRecords} />
                <StatCard icon={Film} label="Content Sources" value={overview?.database?.sources} />
                <StatCard icon={Server} label="Active Sources" value={overview?.database?.activeSources} />
                <StatCard icon={Flag} label="Open Reports" value={overview?.database?.reports} />
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 sm:col-span-2 lg:col-span-3">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Integrations</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={clsx("chip", overview?.tmdbConfigured && "!border-emerald-400/40 !text-emerald-300")}>
                      TMDB {overview?.tmdbConfigured ? "· connected" : "· missing"}
                    </span>
                    <span className={clsx("chip", dbReady && "!border-emerald-400/40 !text-emerald-300")}>
                      Convex {dbReady ? "· connected" : "· not connected"}
                    </span>
                    <span className={clsx("chip", user.mode === "clerk" && "!border-emerald-400/40 !text-emerald-300")}>
                      Clerk auth {user.mode === "clerk" ? "· active" : "· local mode"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {tab === "Sources" && <SourcesManager sources={sources} onChanged={load} disabled={!dbReady} />}

            {tab === "Sync" && <SyncPanel disabled={!dbReady} />}

            {tab === "Users" &&
              (users.length === 0 ? (
                <EmptyState icon={UsersIcon} title="No users yet" description="Users appear here after they sign in." />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/5">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-xs uppercase tracking-wider text-neutral-400">
                      <tr>
                        <th className="px-5 py-3">User</th>
                        <th className="px-5 py-3">Email</th>
                        <th className="px-5 py-3">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="px-5 py-3 font-medium text-white">{u.username ?? u.id.slice(0, 10)}</td>
                          <td className="px-5 py-3 text-neutral-400">{u.email ?? "—"}</td>
                          <td className="px-5 py-3">
                            <span className={clsx("chip", u.role === "admin" && "!border-brand !text-brand-peach")}>
                              {u.role ?? "member"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {tab === "Reports" &&
              (reports.length === 0 ? (
                <EmptyState icon={Flag} title="No reports" description="User playback reports will appear here." />
              ) : (
                <ul className="space-y-3">
                  {reports.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {r.issueType ?? "Issue"} — {r.mediaType ?? "?"} #{r.tmdbId}
                        </p>
                        <p className="text-xs text-neutral-400">{r.description}</p>
                      </div>
                      <span className="chip">{r.status ?? "open"}</span>
                    </li>
                  ))}
                </ul>
              ))}
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <Icon className="h-5 w-5 text-brand-peach" />
      <p className="mt-3 font-display text-2xl font-bold text-white">{value ?? "—"}</p>
      <p className="text-xs text-neutral-400">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Automatic content synchronization panel
// ---------------------------------------------------------------------------

interface SyncStatusData {
  store: "admin-sdk" | "client-sdk" | null;
  automaticSyncEnabled: boolean;
  syncFrequencyHours: number;
  lastSuccessfulSync: number | null;
  lastRunAt: number | null;
  catalog: { movies: number | null; tv: number | null; anime: number | null; total: number | null };
  playbackSources: number | null;
  reports: number | null;
}

interface SyncLogEntry {
  id: string;
  syncType?: string;
  startedAt?: number;
  completedAt?: number;
  status?: string;
  itemsDiscovered?: number;
  itemsInserted?: number;
  itemsUpdated?: number;
  errors?: number;
}

function SyncPanel({ disabled }: { disabled: boolean }) {
  const [status, setStatus] = useState<SyncStatusData | null>(null);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([
        fetch("/api/admin/sync/status").then((r) => r.json()),
        fetch("/api/admin/sync/logs").then((r) => r.json()),
      ]);
      if (!s.error) setStatus(s);
      if (!l.error) setLogs(l.logs ?? []);
    } catch {
      /* handled by disabled state */
    }
  }, []);

  useEffect(() => {
    if (!disabled) load();
  }, [disabled, load]);

  const runNow = async () => {
    setRunning(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST", body: "{}" });
      const data = await res.json();
      const s = data.summary;
      setMessage(
        s?.skipped
          ? s.skipped
          : `Sync complete — discovered ${s?.totalDiscovered ?? 0}, inserted ${s?.totalInserted ?? 0}, updated ${s?.totalUpdated ?? 0}, errors ${s?.totalErrors ?? 0}.`
      );
      await load();
    } catch {
      setMessage("Sync failed — check the Convex deployment connectivity.");
    } finally {
      setRunning(false);
    }
  };

  const toggleAuto = async () => {
    if (!status) return;
    await fetch("/api/admin/sync", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ automaticSyncEnabled: !status.automaticSyncEnabled }),
    });
    await load();
  };

  return (
    <div className="space-y-8">
      {status && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <p className="text-xs uppercase tracking-wider text-neutral-500">Catalog Cache</p>
              <p className="mt-2 font-display text-2xl font-bold text-white">{status.catalog.total ?? "—"}</p>
              <p className="mt-1 text-xs text-neutral-400">
                {status.catalog.movies ?? "—"} movies · {status.catalog.tv ?? "—"} shows · {status.catalog.anime ?? "—"} anime
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <p className="text-xs uppercase tracking-wider text-neutral-500">Automatic Sync</p>
              <p className="mt-2 font-display text-2xl font-bold text-white">
                {status.automaticSyncEnabled ? "On" : "Off"}
              </p>
              <p className="mt-1 text-xs text-neutral-400">Every {status.syncFrequencyHours}h (cron + local scheduler)</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <p className="text-xs uppercase tracking-wider text-neutral-500">Last Successful Sync</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {status.lastSuccessfulSync ? new Date(status.lastSuccessfulSync).toLocaleString() : "—"}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Last run: {status.lastRunAt ? new Date(status.lastRunAt).toLocaleString() : "never"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <p className="text-xs uppercase tracking-wider text-neutral-500">Backend</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {status.store === "admin-sdk" ? "Admin SDK" : status.store === "client-sdk" ? "Web SDK (dev)" : "not connected"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={runNow} disabled={running || disabled} className="btn-primary disabled:opacity-40">
              <RefreshCw className={clsx("h-4 w-4", running && "animate-spin")} />
              {running ? "Synchronizing…" : "Run Sync Now"}
            </button>
            <button onClick={toggleAuto} disabled={disabled} className="btn-secondary disabled:opacity-40">
              {status.automaticSyncEnabled ? "Disable Automatic Sync" : "Enable Automatic Sync"}
            </button>
            <button onClick={load} className="btn-ghost">
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </button>
            {message && <p className="text-sm text-brand-peach">{message}</p>}
          </div>

          <section>
            <h3 className="mb-4 font-display text-base font-semibold text-white">Synchronization Logs</h3>
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center text-sm text-neutral-400">
                No synchronization runs recorded yet — run one manually or wait for the schedule.
              </div>
            ) : (
              <ul className="space-y-3">
                {logs.map((log) => (
                  <li key={log.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">
                        {log.syncType ?? "scheduled"} ·{" "}
                        <span
                          className={clsx(
                            log.status === "success" ? "text-emerald-300" : "text-amber-300"
                          )}
                        >
                          {log.status ?? "unknown"}
                        </span>
                      </p>
                      <p className="text-xs text-neutral-500">
                        {log.startedAt ? new Date(log.startedAt).toLocaleString() : "—"} · discovered{" "}
                        {log.itemsDiscovered ?? 0} · inserted {log.itemsInserted ?? 0} · updated{" "}
                        {log.itemsUpdated ?? 0} · errors {log.errors ?? 0}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SourcesManager({ sources, onChanged, disabled }: { sources: Source[]; onChanged: () => void; disabled: boolean }) {
  const [form, setForm] = useState({
    tmdbId: "",
    mediaType: "movie",
    sourceType: "mp4",
    videoUrl: "",
    rightsStatus: "licensed",
    downloadEnabled: false,
    downloadUrl: "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tmdbId: Number(form.tmdbId),
          downloadUrl: form.downloadUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMessage("Source saved — playback is now enabled for that title.");
      setForm({ ...form, tmdbId: "", videoUrl: "", downloadUrl: "" });
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save source.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/sources/${encodeURIComponent(id)}`, { method: "DELETE" });
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (s: Source) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/sources/${encodeURIComponent(s.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !s.active }),
      });
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      {/* Add source */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-white">
          <Plus className="h-5 w-5 text-brand-peach" /> Add Authorized Source
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-neutral-400">TMDB ID</span>
              <input value={form.tmdbId} onChange={(e) => setForm({ ...form, tmdbId: e.target.value })} className="input-dark" placeholder="e.g. 693134" disabled={disabled} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-neutral-400">Type</span>
              <select value={form.mediaType} onChange={(e) => setForm({ ...form, mediaType: e.target.value })} className="input-dark appearance-none" disabled={disabled}>
                <option value="movie" className="bg-[#2b0008]">Movie</option>
                <option value="tv" className="bg-[#2b0008]">TV</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-neutral-400">Format</span>
              <select value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} className="input-dark appearance-none" disabled={disabled}>
                <option value="mp4" className="bg-[#2b0008]">MP4</option>
                <option value="hls" className="bg-[#2b0008]">HLS (.m3u8)</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-neutral-400">Rights status</span>
              <input value={form.rightsStatus} onChange={(e) => setForm({ ...form, rightsStatus: e.target.value })} className="input-dark" disabled={disabled} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs text-neutral-400">Video URL (https, HLS or MP4)</span>
            <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className="input-dark" placeholder="https://cdn.example.com/…" disabled={disabled} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-neutral-400">Download URL (optional)</span>
            <input value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} className="input-dark" disabled={disabled} />
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" checked={form.downloadEnabled} onChange={(e) => setForm({ ...form, downloadEnabled: e.target.checked })} className="h-4 w-4 accent-[#CD1C18]" disabled={disabled} />
            Allow downloads
          </label>
          <button onClick={submit} disabled={busy || disabled} className="btn-primary w-full disabled:opacity-40">
            {busy ? "Saving…" : "Save Source"}
          </button>
          {message && <p className="text-xs text-brand-peach">{message}</p>}
          {disabled && (
            <p className="text-xs text-neutral-500">Connect Convex to manage sources.</p>
          )}
        </div>
      </div>

      {/* Source list */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-white">Configured Sources</h3>
          <button onClick={onChanged} className="btn-ghost !py-1.5 text-xs">
            <RefreshCcw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
        {sources.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center text-sm text-neutral-400">
            No sources yet. Titles without a source play their official trailer instead.
          </div>
        ) : (
          <ul className="space-y-3">
            {sources.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">
                    <Link href={`/${s.mediaType}/${s.tmdbId}`} className="hover:text-brand-peach">
                      {s.mediaType === "movie" ? "Movie" : "TV"} #{s.tmdbId}
                    </Link>{" "}
                    <span className="chip ml-2 !text-[10px]">{s.sourceType.toUpperCase()}</span>
                  </p>
                  <p className="truncate text-xs text-neutral-500">{s.videoUrl}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => toggle(s)} disabled={busy} className={clsx("chip transition-colors", s.active ? "chip-selected" : "hover:border-white/40")}>
                    {s.active ? "Active" : "Paused"}
                  </button>
                  <button onClick={() => remove(s.id)} disabled={busy} aria-label="Delete source" className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 hover:bg-brand/20 hover:text-white">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
