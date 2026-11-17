import { api } from "../../../../convex/_generated/api";
import { authedClient } from "@/lib/convex";

export type AppRole = "ATTENDEE" | "VOLUNTEER" | "ORGANIZER" | "ADMIN";

/**
 * Role helpers — identity now lives in Clerk; roles live in the Convex
 * user_roles table, fetched through the `users.me` query.
 */
export async function getRolesForCurrentUser(): Promise<AppRole[]> {
  const me = await (await authedClient()).query(api.users.me, {});
  const roles = (me as any)?.roles ?? [];
  return roles.map((r: any) => r.role as AppRole);
}

export function hasAnyRole(roles: AppRole[], allowed: AppRole[]) {
  return allowed.some((role) => roles.includes(role));
}

export async function requireRole(allowed: AppRole[]) {
  const me = await (await authedClient()).query(api.users.me, {});
  const roles = ((me as any)?.roles ?? []).map((r: any) => r.role as AppRole);
  if (!hasAnyRole(roles, allowed)) {
    throw new Error("Insufficient permissions");
  }
  return { me, roles };
}
