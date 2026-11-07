import { NextRequest } from "next/server";
import {
  getAiringTodayTV,
  getOnTheAirTV,
  getPopularTV,
  getTopRatedTV,
  getTrendingTV,
} from "@/lib/tmdb";
import { jsonError, jsonOk, parseIntParam, pickEnum } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const CATEGORIES = ["trending", "popular", "top-rated", "airing-today", "on-the-air"] as const;

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
        return jsonOk(await getTrendingTV("day", page));
      case "popular":
        return jsonOk(await getPopularTV(page));
      case "top-rated":
        return jsonOk(await getTopRatedTV(page));
      case "airing-today":
        return jsonOk(await getAiringTodayTV(page));
      case "on-the-air":
        return jsonOk(await getOnTheAirTV(page));
    }
  } catch (err) {
    console.error(`GET /api/tv/${category} failed:`, err);
    return jsonError(502, "TMDB request failed. Check TMDB_API_KEY configuration.");
  }
}
