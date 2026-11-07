import { NextRequest } from "next/server";
import { getPopularTV, getTopRatedTV, getAiringTodayTV, getOnTheAirTV, getTrendingTV } from "@/lib/tmdb";
import { jsonError, jsonOk, parseIntParam, pickEnum } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/catalog/tv?category=trending|popular|top-rated|airing-today|on-the-air&page=1
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const category = pickEnum(
    sp.get("category"),
    ["trending", "popular", "top-rated", "airing-today", "on-the-air"] as const,
    "popular"
  );
  const page = parseIntParam(sp.get("page"), 1);

  try {
    switch (category) {
      case "trending":
        return jsonOk(await getTrendingTV("day", page));
      case "top-rated":
        return jsonOk(await getTopRatedTV(page));
      case "airing-today":
        return jsonOk(await getAiringTodayTV(page));
      case "on-the-air":
        return jsonOk(await getOnTheAirTV(page));
      default:
        return jsonOk(await getPopularTV(page));
    }
  } catch (err) {
    console.error("GET /api/catalog/tv failed:", err);
    return jsonError(502, "TMDB request failed.");
  }
}
