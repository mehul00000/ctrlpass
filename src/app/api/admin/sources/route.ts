import { NextRequest } from "next/server";
import { getAdminContext } from "@/lib/auth-guard";
import { convexConfigured, listSources, upsertSource } from "@/lib/convex-server";
import { jsonError, jsonOk } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

interface SourcePayload {
  tmdbId?: number;
  mediaType?: string;
  sourceType?: string;
  videoUrl?: string;
  availableQualities?: string[];
  subtitleTracks?: Array<{ label: string; srcLang: string; url: string }>;
  downloadEnabled?: boolean;
  downloadUrl?: string | null;
  rightsStatus?: string;
  active?: boolean;
}

function validate(body: SourcePayload): { ok: true } | { ok: false; message: string } {
  if (!Number.isInteger(body.tmdbId) || (body.tmdbId ?? 0) <= 0) return { ok: false, message: "tmdbId must be a positive integer." };
  if (body.mediaType !== "movie" && body.mediaType !== "tv") return { ok: false, message: "mediaType must be 'movie' or 'tv'." };
  if (body.sourceType !== "hls" && body.sourceType !== "mp4") return { ok: false, message: "sourceType must be 'hls' or 'mp4'." };
  if (typeof body.videoUrl !== "string" || !/^https:\/\//.test(body.videoUrl)) return { ok: false, message: "videoUrl must be an https URL." };
  return { ok: true };
}

export async function GET() {
  const guard = await getAdminContext();
  if (!guard.ok) return jsonError(guard.status, guard.message);
  if (!convexConfigured()) {
    return jsonError(503, "Convex is not configured (NEXT_PUBLIC_CONVEX_URL / CONVEX_DEPLOY_KEY).");
  }

  const sources = await listSources();
  return jsonOk({ sources, store: "convex" });
}

export async function POST(request: NextRequest) {
  const guard = await getAdminContext();
  if (!guard.ok) return jsonError(guard.status, guard.message);
  if (!convexConfigured()) {
    return jsonError(503, "Convex is not configured.");
  }

  let body: SourcePayload;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const v = validate(body);
  if (!v.ok) return jsonError(400, v.message);

  await upsertSource({
    tmdbId: body.tmdbId!,
    mediaType: body.mediaType as "movie" | "tv",
    sourceType: body.sourceType as "hls" | "mp4",
    videoUrl: body.videoUrl!,
    availableQualities: body.availableQualities ?? [],
    subtitleTracks: body.subtitleTracks ?? [],
    downloadEnabled: body.downloadEnabled ?? false,
    downloadUrl: body.downloadUrl ?? null,
    rightsStatus: body.rightsStatus ?? "licensed",
    active: body.active ?? true,
    updatedBy: guard.ctx.email,
  });

  return jsonOk({ created: true, store: "convex" });
}
