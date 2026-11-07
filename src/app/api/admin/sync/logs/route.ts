import { getAdminContext } from "@/lib/auth-guard";
import { convexConfigured, syncLogs } from "@/lib/convex-server";
import { jsonError, jsonOk } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/** GET /api/admin/sync/logs — recent synchronization runs. */
export async function GET() {
  const guard = await getAdminContext();
  if (!guard.ok) return jsonError(guard.status, guard.message);
  if (!convexConfigured()) {
    return jsonError(503, "Convex is not configured.");
  }
  const logs = await syncLogs();
  return jsonOk({ logs });
}
