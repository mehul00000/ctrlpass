import { NextRequest } from "next/server";
import { getPopularMovies, getTopRatedMovies, getNowPlayingMovies, getUpcomingMovies, getTrendingMovies, getLatestReleases } from "@/lib/tmdb";
import { jsonError, jsonOk, parseIntParam, pickEnum } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/catalog/movies?category=trending|popular|top-rated|now-playing|upcoming|latest&page=1
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const category = pickEnum(
    sp.get("category"),
    ["trending", "popular", "top-rated", "now-playing", "upcoming", "latest"] as const,
    "popular"
  );
  const page = parseIntParam(sp.get("page"), 1);

  try {
    switch (category) {
      case "trending":
        return jsonOk(await getTrendingMovies("day", page));
      case "top-rated":
        return jsonOk(await getTopRatedMovies(page));
      case "now-playing":
        return jsonOk(await getNowPlayingMovies(page));
      case "upcoming":
        return jsonOk(await getUpcomingMovies(page));
      case "latest":
        return jsonOk(await getLatestReleases(page));
      default:
        return jsonOk(await getPopularMovies(page));
    }
  } catch (err) {
    console.error("GET /api/catalog/movies failed:", err);
    return jsonError(502, "TMDB request failed.");
  }
}
