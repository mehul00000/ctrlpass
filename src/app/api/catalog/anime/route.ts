import { NextRequest } from "next/server";
import { getAnimeMovies, getAnimeSeries, getTopRatedAnime } from "@/lib/tmdb";
import { jsonError, jsonOk, parseIntParam, pickEnum } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/catalog/anime?category=series|movies|top|trending&page=1
 * Anime = TMDB Animation genre (16) + Japanese original language.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const category = pickEnum(sp.get("category"), ["series", "movies", "top", "trending"] as const, "series");
  const page = parseIntParam(sp.get("page"), 1);

  try {
    switch (category) {
      case "movies":
        return jsonOk(await getAnimeMovies(page));
      case "top":
        return jsonOk(await getTopRatedAnime(page));
      case "trending":
        return jsonOk(await getAnimeSeries(page));
      default:
        return jsonOk(await getAnimeSeries(page));
    }
  } catch (err) {
    console.error("GET /api/catalog/anime failed:", err);
    return jsonError(502, "TMDB request failed.");
  }
}
