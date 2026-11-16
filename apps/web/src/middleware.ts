import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

const isProtectedRoute = createRouteMatcher([
  '/organizer/:path*',
  '/admin/:path*',
]);

/*
 * Composite auth gate:
 * - clerkMiddleware keeps Clerk (Google OAuth) sessions alive app-wide, so
 *   client components read real session state via useUser()/UserButton.
 * - /organizer and /admin keep the existing Supabase session + staff-role
 *   enforcement (updateSession), which also redirects unauthenticated visitors
 *   to /login and /admin/login respectively. A Clerk-only identity has no
 *   Supabase staff role yet, so staff routes still redirect them — identity
 *   mapping between Clerk ids and Supabase UUIDs is not built.
 */
function clerkAppMiddleware() {
  return clerkMiddleware(async (_auth, request) => {
    if (isProtectedRoute(request)) {
      return updateSession(request);
    }

    return NextResponse.next();
  });
}

/*
 * Clerk keys not set yet (or only partially — clerkMiddleware hard-requires
 * the secret key to fetch instance config) — keep the exact pre-Clerk
 * behaviour instead of throwing on every request (mirrors Providers.tsx).
 */
async function legacyMiddleware(request: NextRequest) {
  if (isProtectedRoute(request)) {
    return updateSession(request);
  }

  return NextResponse.next();
}

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
);

export default clerkConfigured ? clerkAppMiddleware() : legacyMiddleware;

export const config = {
  matcher: [
    // Run Clerk session handling everywhere except static assets.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
