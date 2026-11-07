import "server-only";
import { auth, clerkClient } from "@clerk/nextjs/server";

// ---------------------------------------------------------------------------
// Server-side authorization. Admin decisions are NEVER made from UI state —
// every admin API call re-validates the session and role on the server.
// ---------------------------------------------------------------------------

export interface AdminContext {
  userId: string;
  email: string;
}

async function isAdminEmail(email: string): Promise<boolean> {
  const configured = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return configured.includes(email.toLowerCase());
}

/** True when the email is on the ADMIN_EMAILS allow-list. */
export async function checkIsAdminEmail(email: string): Promise<boolean> {
  if (!email) return false;
  return isAdminEmail(email);
}

/** Returns the caller's identity when they are an authenticated admin. */
export async function getAdminContext(): Promise<
  { ok: true; ctx: AdminContext } | { ok: false; status: number; message: string }
> {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return {
      ok: false,
      status: 503,
      message:
        "Admin operations require Clerk authentication. Configure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.",
    };
  }

  const { userId } = await auth();
  if (!userId) {
    return { ok: false, status: 401, message: "Authentication required." };
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.primaryEmailAddress?.emailAddress ?? "";
    if (await isAdminEmail(email)) {
      return { ok: true, ctx: { userId, email } };
    }
    return { ok: false, status: 403, message: "Administrator role required." };
  } catch (err) {
    console.error("Admin context lookup failed:", err);
    return { ok: false, status: 500, message: "Could not verify admin permissions." };
  }
}

/** Returns the caller's identity when they are any authenticated user. */
export async function getAuthContext(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; message: string }
> {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return { ok: false, status: 503, message: "Authentication is not configured yet." };
  }
  const { userId } = await auth();
  if (!userId) return { ok: false, status: 401, message: "Authentication required." };
  return { ok: true, userId };
}
