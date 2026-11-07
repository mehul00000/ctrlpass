import { NextRequest } from "next/server";
import {
  getLatestReleases,
  getNowPlayingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
  getUpcomingMovies,
} from "@/lib/tmdb";
import { jsonError, jsonOk, parseIntParam, pickEnum } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const CATEGORIES = ["trending", "popular", "top-rated", "now-playing", "upcoming", "latest"] as const;
type Category = (typeof CATEGORIES)[number];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category: raw } = await params;
  const category = pickEnum(raw, CATEGORIES, "popular");
  const page = parseIntParam(request.nextUrl.searchParams.get("page"), 1);

  try {
    switch (category) {
      case "trending":
        return jsonOk(await getTrendingMovies("day", page));
      case "popular":
        return jsonOk(await getPopularMovies(page));
      case "top-rated":
        return jsonOk(await getTopRatedMovies(page));
      case "now-playing":
        return jsonOk(await getNowPlayingMovies(page));
      case "upcoming":
        return jsonOk(await getUpcomingMovies(page));
      case "latest":
        return jsonOk(await getLatestReleases(page));
    }
  } catch (err) {
    console.error(`GET /api/movies/${category} failed:`, err);
    return jsonError(502, "TMDB request failed. Check TMDB_API_KEY configuration.");
  }
}
