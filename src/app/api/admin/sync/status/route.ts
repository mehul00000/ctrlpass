import { getAdminContext } from "@/lib/auth-guard";
import { convexConfigured, syncSettings, catalogCounts } from "@/lib/convex-server";
import { jsonError, jsonOk } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/** GET /api/admin/sync/status — synchronization state for the dashboard. */
export async function GET() {
  const guard = await getAdminContext();
  if (!guard.ok) return jsonError(guard.status, guard.message);
  if (!convexConfigured()) {
    return jsonOk({ store: null, database: null });
  }

  const [settings, counts] = await Promise.all([syncSettings(), catalogCounts()]);
  return jsonOk({
    store: "convex",
    automaticSyncEnabled: (settings as any)?.automaticSyncEnabled ?? true,
    syncFrequencyHours: (settings as any)?.syncFrequencyHours ?? 6,
    lastSuccessfulSync: (settings as any)?.lastSuccessfulSync ?? null,
    lastRunAt: (settings as any)?.lastRunAt ?? null,
    catalog: {
      movies: counts.movies,
      tv: counts.tv,
      anime: counts.anime,
      total: counts.total,
    },
  });
}
