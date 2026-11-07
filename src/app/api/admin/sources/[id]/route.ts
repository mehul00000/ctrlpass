import { NextRequest } from "next/server";
import { getAdminContext } from "@/lib/auth-guard";
import { convexConfigured, patchSource, deleteSource } from "@/lib/convex-server";
import { jsonError, jsonOk } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await getAdminContext();
  if (!guard.ok) return jsonError(guard.status, guard.message);
  if (!convexConfigured()) {
    return jsonError(503, "Convex is not configured.");
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const allowed = [
    "videoUrl",
    "sourceType",
    "availableQualities",
    "subtitleTracks",
    "downloadEnabled",
    "downloadUrl",
    "rightsStatus",
    "active",
  ] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }
  if (patch.sourceType && patch.sourceType !== "hls" && patch.sourceType !== "mp4") {
    return jsonError(400, "sourceType must be 'hls' or 'mp4'.");
  }
  if (patch.videoUrl && !/^https:\/\//.test(String(patch.videoUrl))) {
    return jsonError(400, "videoUrl must be an https URL.");
  }
  if (Object.keys(patch).length === 0) {
    return jsonError(400, "Nothing to update.");
  }

  try {
    await patchSource(id, patch, guard.ctx.email);
    return jsonOk({ id, updated: true });
  } catch (err) {
    console.error("PATCH /api/admin/sources/[id] failed:", err);
    return jsonError(503, "Convex update failed — check the deployment.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await getAdminContext();
  if (!guard.ok) return jsonError(guard.status, guard.message);
  if (!convexConfigured()) {
    return jsonError(503, "Convex is not configured.");
  }

  const { id } = await params;
  try {
    await deleteSource(id);
    return jsonOk({ id, deleted: true });
  } catch (err) {
    console.error("DELETE /api/admin/sources/[id] failed:", err);
    return jsonError(503, "Convex delete failed — check the deployment.");
  }
}
