import { NextRequest } from "next/server";
import { convexAdmin } from "@/lib/convex-server";
import { api } from "convex/_generated/api";
import { jsonError, jsonOk } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/sync — scheduled synchronization entry point (Vercel Cron).
 * Protected with a shared secret: Authorization: Bearer <CRON_SECRET>.
 * The Convex cron (convex/crons.ts) also runs this every 6h natively.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return jsonError(503, "CRON_SECRET is not configured — scheduled sync disabled.");
  }

  const header = request.headers.get("authorization") ?? "";
  if (header !== `Bearer ${secret}`) {
    return jsonError(401, "Invalid cron credentials.");
  }

  const summary = await convexAdmin().action(api.catalog.syncAll, {});
  return jsonOk({ ok: true, summary });
}
