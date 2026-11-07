import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { checkIsAdminEmail } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/me — identity for UI gating (admin button visibility etc.).
 * The isAdmin decision is always computed server-side from ADMIN_EMAILS —
 * the client never decides who is an admin.
 */
export async function GET() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return NextResponse.json({ signedIn: false, email: null, isAdmin: false });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ signedIn: false, email: null, isAdmin: false });
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.primaryEmailAddress?.emailAddress ?? "";
    const isAdmin = await checkIsAdminEmail(email);
    return NextResponse.json({ signedIn: true, email, isAdmin });
  } catch (err) {
    console.error("GET /api/user/me failed:", err);
    return NextResponse.json({ signedIn: true, email: null, isAdmin: false });
  }
}
