import { NextRequest } from "next/server";
import { getAdminContext } from "@/lib/auth-guard";
import { convexConfigured, syncAll, setAutomaticSync } from "@/lib/convex-server";
import { jsonError, jsonOk, sanitizeQuery } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** POST /api/admin/sync — run synchronization manually (admin only). */
export async function POST(request: NextRequest) {
  const guard = await getAdminContext();
  if (!guard.ok) return jsonError(guard.status, guard.message);
  if (!convexConfigured()) {
    return jsonError(503, "Convex is not configured.");
  }

  let types: string[] | undefined;
  try {
    const body = (await request.json()) as { types?: unknown };
    if (Array.isArray(body.types)) {
      types = body.types.map((t) => sanitizeQuery(String(t))).filter(Boolean);
    }
  } catch {
    /* body optional */
  }

  const summary = await syncAll(types);
  return jsonOk({ summary });
}

/** PATCH /api/admin/sync — enable/disable automatic synchronization. */
export async function PATCH(request: NextRequest) {
  const guard = await getAdminContext();
  if (!guard.ok) return jsonError(guard.status, guard.message);
  if (!convexConfigured()) {
    return jsonError(503, "Convex is not configured.");
  }

  let body: { automaticSyncEnabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }
  if (typeof body.automaticSyncEnabled !== "boolean") {
    return jsonError(400, "automaticSyncEnabled boolean is required.");
  }

  await setAutomaticSync(body.automaticSyncEnabled);
  return jsonOk({ automaticSyncEnabled: body.automaticSyncEnabled, updated: true });
}
