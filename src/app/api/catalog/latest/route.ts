import { NextRequest } from "next/server";
import { getLatestReleases, searchMulti } from "@/lib/tmdb";
import { jsonError, jsonOk, parseIntParam, sanitizeQuery } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/catalog/latest — newest releases with meaningful traction.
 * GET /api/catalog/latest?mode=search&q=... — convenience search alias.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sanitizeQuery(sp.get("q"));
  try {
    if (q) return jsonOk(await searchMulti(q, parseIntParam(sp.get("page"), 1)));
    return jsonOk(await getLatestReleases(parseIntParam(sp.get("page"), 1)));
  } catch (err) {
    console.error("GET /api/catalog/latest failed:", err);
    return jsonError(502, "TMDB request failed.");
  }
}
