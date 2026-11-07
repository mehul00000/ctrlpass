import { getAdminContext } from "@/lib/auth-guard";
import { convexConfigured, adminOverview, catalogCounts } from "@/lib/convex-server";
import { TMDB_CONFIGURED } from "@/lib/tmdb";
import { jsonError, jsonOk } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await getAdminContext();
  if (!guard.ok) return jsonError(guard.status, guard.message);

  const base = {
    tmdbConfigured: TMDB_CONFIGURED,
    convexConfigured: convexConfigured(),
    store: convexConfigured() ? ("convex" as const) : null,
    reason: null,
  };

  if (!convexConfigured()) {
    return jsonOk({ ...base, database: null });
  }

  try {
    const [ov, cc] = await Promise.all([adminOverview(), catalogCounts()]);
    return jsonOk({
      ...base,
      database: {
        users: ov.users,
        watchlistEntries: ov.watchlistEntries,
        historyRecords: ov.historyRecords,
        sources: ov.sources,
        activeSources: ov.activeSources,
        reports: ov.reports,
        catalogTotal: cc.total,
        catalogMovies: cc.movies,
        catalogTV: cc.tv,
        catalogAnime: cc.anime,
      },
    });
  } catch (err) {
    console.error("GET /api/admin/overview failed:", err);
    return jsonError(500, "Could not read platform statistics.");
  }
}
