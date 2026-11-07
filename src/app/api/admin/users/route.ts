import { NextRequest } from "next/server";
import { getAdminContext } from "@/lib/auth-guard";
import { convexConfigured, listUsers, patchUserRole } from "@/lib/convex-server";
import { jsonError, jsonOk, sanitizeQuery } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

interface AdminUser {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}

export async function GET(request: NextRequest) {
  const guard = await getAdminContext();
  if (!guard.ok) return jsonError(guard.status, guard.message);
  if (!convexConfigured()) {
    return jsonError(503, "Convex is not configured.");
  }

  const search = sanitizeQuery(request.nextUrl.searchParams.get("q")).toLowerCase();
  const users = (await listUsers()) as unknown as AdminUser[];
  const filtered = users.filter(
    (u) =>
      !search ||
      String(u.email ?? "").toLowerCase().includes(search) ||
      String(u.username ?? "").toLowerCase().includes(search)
  );
  return jsonOk({ users: filtered });
}

export async function PATCH(request: NextRequest) {
  const guard = await getAdminContext();
  if (!guard.ok) return jsonError(guard.status, guard.message);
  if (!convexConfigured()) {
    return jsonError(503, "Convex is not configured.");
  }

  let body: { userId?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }
  if (!body.userId || !["admin", "member"].includes(body.role ?? "")) {
    return jsonError(400, "userId and role ('admin'|'member') are required.");
  }

  await patchUserRole(body.userId, body.role as "admin" | "member", guard.ctx.email);
  return jsonOk({ userId: body.userId, role: body.role, updated: true });
}
