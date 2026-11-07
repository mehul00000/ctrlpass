import { NextRequest } from "next/server";
import { getSeasonDetails } from "@/lib/tmdb";
import { jsonError, jsonOk, parseIntParam } from "@/lib/api-helpers";

export const revalidate = 3600;

/** GET /api/tv/season/[season]?tvId=123 — episode list for a season. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ season: string }> }
) {
  const { season } = await params;
  const tvId = parseIntParam(request.nextUrl.searchParams.get("tvId"), 0, 0, 10_000_000);
  const seasonNum = Number(season);
  if (!tvId || !Number.isInteger(seasonNum)) {
    return jsonError(400, "Valid tvId query param and season number are required.");
  }
  try {
    return jsonOk(await getSeasonDetails(tvId, seasonNum));
  } catch (err) {
    console.error(`GET /api/tv/season/${seasonNum} (tv ${tvId}) failed:`, err);
    return jsonError(502, "Could not load season details from TMDB.");
  }
}
