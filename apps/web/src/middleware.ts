import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/*
 * Clerk-only auth gate (Supabase removed).
 * /organizer/* and /admin/* require a session; staff role authorization is
 * enforced server-side inside the Convex queries (is_admin / organizer
 * membership checks), mirroring the old RLS posture.
 */
const isProtectedRoute = createRouteMatcher([
  '/organizer/:path*',
  '/admin/:path*',
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      const isStaffLogin = request.nextUrl.pathname.startsWith('/admin');
      const signInUrl = new URL(isStaffLogin ? '/admin/login' : '/login', request.nextUrl.origin);
      signInUrl.searchParams.set('redirect_url', request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
