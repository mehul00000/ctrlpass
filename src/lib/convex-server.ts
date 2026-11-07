import "server-only";
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "convex/_generated/api";

// ---------------------------------------------------------------------------
// Server-side Convex access with deployment admin auth. Internal functions
// (admin CRUD, sync, playback lookup) are only callable this way — the Next.js
// routes that use them first verify the Clerk session + ADMIN_EMAILS role.
// ---------------------------------------------------------------------------

const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
const deployKey = process.env.CONVEX_DEPLOY_KEY ?? "";

let adminClient: ConvexHttpClient | null = null;

export function convexConfigured(): boolean {
  return Boolean(url && deployKey);
}

export function convexAdmin(): ConvexHttpClient {
  if (!url || !deployKey) throw new Error("Convex is not configured (NEXT_PUBLIC_CONVEX_URL / CONVEX_DEPLOY_KEY).");
  if (!adminClient) {
    adminClient = new ConvexHttpClient(url);
    (adminClient as unknown as { setAdminAuth: (key: string, url?: string) => void }).setAdminAuth(deployKey, url);
  }
  return adminClient;
}

// Internal function references are typed public-only on ConvexHttpClient;
// admin auth permits them at runtime, so the refs are cast here once.
function q(ref: unknown, args?: unknown): Promise<unknown> {
  return (convexAdmin().query as unknown as (ref: unknown, args?: unknown) => Promise<unknown>)(ref, args);
}
function m(ref: unknown, args?: unknown): Promise<unknown> {
  return (convexAdmin().mutation as unknown as (ref: unknown, args?: unknown) => Promise<unknown>)(ref, args);
}

// --- typed wrappers used by the Next.js API routes ---------------------------

export async function adminOverview() {
  return q(internal.adminData.overview) as Promise<{
    users: number;
    watchlistEntries: number;
    historyRecords: number;
    sources: number;
    activeSources: number;
    reports: number;
  }>;
}

export async function listSources() {
  return q(internal.adminData.listSources) as Promise<Array<Record<string, unknown>>>;
}

export async function upsertSource(data: {
  tmdbId: number;
  mediaType: "movie" | "tv";
  sourceType: "hls" | "mp4";
  videoUrl: string;
  availableQualities: string[];
  subtitleTracks: Array<{ label: string; srcLang: string; url: string }>;
  downloadEnabled: boolean;
  downloadUrl: string | null;
  rightsStatus: string;
  active: boolean;
  updatedBy: string;
}) {
  return m(internal.adminData.upsertSource, data);
}

export async function patchSource(id: string, patch: Record<string, unknown>, updatedBy: string) {
  return m(internal.adminData.patchSource, {
    id,
    patch: { ...(patch as Record<string, unknown>), updatedAt: Date.now(), updatedBy },
  });
}

export async function deleteSource(id: string) {
  return m(internal.adminData.deleteSource, { id });
}

export async function listUsers() {
  return q(internal.adminData.listUsers) as Promise<Array<Record<string, unknown>>>;
}

export async function patchUserRole(id: string, role: "admin" | "member", updatedBy: string) {
  return m(internal.adminData.patchUserRole, { id, role, updatedBy });
}

export async function listReports() {
  return q(internal.adminData.listReports) as Promise<Array<Record<string, unknown>>>;
}

export async function setReportStatus(id: string, status: "open" | "resolved" | "dismissed", updatedBy: string) {
  return m(internal.adminData.setReportStatus, { id, status, updatedBy });
}

export async function syncAll(types?: string[]) {
  return convexAdmin().action(api.catalog.syncAll, { types });
}

export async function setAutomaticSync(enabled: boolean) {
  return convexAdmin().mutation(api.catalog.setAutomaticSyncEnabled, { enabled });
}

export async function syncLogs() {
  return convexAdmin().query(api.catalog.syncLogs, {});
}

export async function syncSettings() {
  return convexAdmin().query(api.catalog.syncSettings, {});
}

export async function playbackLookup(mediaType: "movie" | "tv", tmdbId: number) {
  return q(internal.playback.lookupSource, { mediaType, tmdbId }) as Promise<Record<string, unknown> | null>;
}

export async function playbackUnavailable(mediaType: "movie" | "tv", tmdbId: number) {
  return q(internal.playback.isMarkedUnavailable, { mediaType, tmdbId }) as Promise<boolean>;
}

export async function catalogCounts() {
  return q(internal.catalog.counts) as Promise<{ movies: number; tv: number; anime: number; total: number }>;
}
