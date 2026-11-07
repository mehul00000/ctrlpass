import { NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth-guard";
import { getPlaybackSource } from "@/lib/playback";
import { jsonError, jsonOk } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/playback/[type]/[id] — returns the authorized playback source for a
 * title, if an active one has been configured by an administrator. Access
 * requires a signed-in session; rights metadata is included for auditing.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type: rawType, id: rawId } = await params;
  const tmdbId = Number(rawId);
  if ((rawType !== "movie" && rawType !== "tv") || !Number.isInteger(tmdbId)) {
    return jsonError(400, "Invalid media type or id.");
  }

  const auth = await getAuthContext();
  if (!auth.ok) return jsonError(auth.status, auth.message);

  const source = await getPlaybackSource(rawType, tmdbId);
  if (!source) {
    return jsonOk({ source: null, reason: "No authorized source configured for this title." });
  }

  return jsonOk({
    source: {
      sourceType: source.sourceType,
      videoUrl: source.videoUrl,
      availableQualities: source.availableQualities,
      subtitleTracks: source.subtitleTracks,
      downloadEnabled: source.downloadEnabled,
      rightsStatus: source.rightsStatus,
    },
  });
}
