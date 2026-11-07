import { NextRequest } from "next/server";
import { getAdminContext } from "@/lib/auth-guard";
import { convexConfigured, listReports, setReportStatus } from "@/lib/convex-server";
import { jsonError, jsonOk } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await getAdminContext();
  if (!guard.ok) return jsonError(guard.status, guard.message);
  if (!convexConfigured()) {
    return jsonError(503, "Convex is not configured.");
  }

  const reports = await listReports();
  return jsonOk({ reports });
}

export async function PATCH(request: NextRequest) {
  const guard = await getAdminContext();
  if (!guard.ok) return jsonError(guard.status, guard.message);
  if (!convexConfigured()) {
    return jsonError(503, "Convex is not configured.");
  }

  let body: { id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }
  if (!body.id || !["open", "resolved", "dismissed"].includes(body.status ?? "")) {
    return jsonError(400, "id and status ('open'|'resolved'|'dismissed') are required.");
  }

  await setReportStatus(body.id, body.status as "open" | "resolved" | "dismissed", guard.ctx.email);
  return jsonOk({ id: body.id, status: body.status, updated: true });
}
