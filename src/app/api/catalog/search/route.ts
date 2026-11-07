import { NextRequest } from "next/server";
import { searchMulti } from "@/lib/tmdb";
import { jsonError, jsonOk, parseIntParam, sanitizeQuery } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/** GET /api/catalog/search?q=...&page=1 — multi search across movies/TV/people. */
export async function GET(request: NextRequest) {
  const q = sanitizeQuery(request.nextUrl.searchParams.get("q"));
  if (!q) return jsonError(400, "Query parameter 'q' is required.");
  try {
    return jsonOk(await searchMulti(q, parseIntParam(request.nextUrl.searchParams.get("page"), 1)));
  } catch (err) {
    console.error("GET /api/catalog/search failed:", err);
    return jsonError(502, "TMDB search failed.");
  }
}
