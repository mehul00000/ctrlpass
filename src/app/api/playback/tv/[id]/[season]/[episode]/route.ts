import { NextRequest } from "next/server";
import { resolvePlayback } from "@/lib/playback";
import { getAuthContext } from "@/lib/auth-guard";
import { jsonError, jsonOk } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/playback/tv/[tmdbId]/[season]/[episode] — playback decision for a
 * TV episode (Vidy embed, admin source, seeded demo, or unavailable).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; season: string; episode: string }> }
) {
  const { id, season, episode } = await params;
  const tmdbId = Number(id);
  const seasonNum = Number(season);
  const episodeNum = Number(episode);
  if (!Number.isInteger(tmdbId) || !Number.isInteger(seasonNum) || !Number.isInteger(episodeNum)) {
    return jsonError(400, "Invalid tmdbId, season or episode.");
  }

  const auth = await getAuthContext();
  if (!auth.ok) return jsonError(auth.status, auth.message);

  const resolved = await resolvePlayback("tv", tmdbId, seasonNum, episodeNum);
  return jsonOk(resolved);
}
