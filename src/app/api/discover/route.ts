import { NextRequest } from "next/server";
import { getAnimeMovies, getAnimeSeries, getDiscoverMovies, getDiscoverTV, getTopRatedAnime } from "@/lib/tmdb";
import { jsonError, jsonOk, parseIntParam, pickEnum } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/**
 * Unified discovery endpoint powering filter panels and infinite scroll:
 *   /api/discover?type=movie&genre=28&year=2025&sort=vote_average.desc&rating=7&lang=ja&page=2
 *   /api/discover?type=anime&tab=series|movies|top
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const type = pickEnum(sp.get("type"), ["movie", "tv", "anime"] as const, "movie");
  const page = parseIntParam(sp.get("page"), 1);

  try {
    if (type === "anime") {
      const tab = pickEnum(sp.get("tab"), ["series", "movies", "top"] as const, "series");
      if (tab === "movies") return jsonOk(await getAnimeMovies(page));
      if (tab === "top") return jsonOk(await getTopRatedAnime(page));
      return jsonOk(await getAnimeSeries(page));
    }

    const filters = {
      page,
      genre: sp.get("genre") ?? undefined,
      year: sp.get("year") ?? undefined,
      sortBy: sp.get("sort") ?? undefined,
      language: sp.get("lang") ?? undefined,
      minRating: sp.get("rating") ?? undefined,
      minVotes: 40,
    };

    if (type === "movie") return jsonOk(await getDiscoverMovies(filters));
    return jsonOk(await getDiscoverTV(filters));
  } catch (err) {
    console.error("GET /api/discover failed:", err);
    return jsonError(502, "TMDB request failed. Check TMDB_API_KEY configuration.");
  }
}
