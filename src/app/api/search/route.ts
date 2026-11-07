import { NextRequest } from "next/server";
import { searchMovies, searchMulti, searchTV } from "@/lib/tmdb";
import { jsonError, jsonOk, parseIntParam, pickEnum, sanitizeQuery } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const query = sanitizeQuery(sp.get("q"));
  const page = parseIntParam(sp.get("page"), 1);
  const type = pickEnum(sp.get("type"), ["all", "movie", "tv"] as const, "all");

  if (query.length < 1) {
    return jsonError(400, "Query parameter 'q' is required.");
  }

  try {
    switch (type) {
      case "movie":
        return jsonOk(await searchMovies(query, page));
      case "tv":
        return jsonOk(await searchTV(query, page));
      default:
        return jsonOk(await searchMulti(query, page));
    }
  } catch (err) {
    console.error("GET /api/search failed:", err);
    return jsonError(502, "TMDB search failed. Check TMDB_API_KEY configuration.");
  }
}
