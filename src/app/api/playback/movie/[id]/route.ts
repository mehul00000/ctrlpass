import { NextRequest } from "next/server";
import { resolvePlayback } from "@/lib/playback";
import { getAuthContext } from "@/lib/auth-guard";
import { jsonError, jsonOk } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/playback/movie/[tmdbId] — playback decision for a movie.
 * Requires a signed-in session when auth is configured.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tmdbId = Number(id);
  if (!Number.isInteger(tmdbId)) return jsonError(400, "Invalid tmdbId.");

  const auth = await getAuthContext();
  if (!auth.ok) return jsonError(auth.status, auth.message);

  const resolved = await resolvePlayback("movie", tmdbId);
  return jsonOk(resolved);
}
