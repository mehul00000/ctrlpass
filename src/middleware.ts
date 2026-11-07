import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

/**
 * Installs the Clerk session context for every request. Route protection is
 * enforced server-side in each protected page/route (see watch page, profile
 * and history layouts, and auth-guard for admin APIs) so redirects always go
 * to CtrlPass's own themed sign-in page with a return path.
 */
const CLERK_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

const clerkAuth = CLERK_ENABLED ? clerkMiddleware() : null;

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (clerkAuth) return clerkAuth(req, event);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
