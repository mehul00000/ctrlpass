import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAnonKey, supabaseUrl } from './config';

const ADMIN_ROLES = new Set(['ADMIN']);
const ORGANIZER_ROLES = new Set(['ORGANIZER', 'ADMIN']);

async function activeRoles(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE');
  return new Set((data ?? []).map((r) => r.role));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    return supabaseResponse;
  }

  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
    const roles = await activeRoles(supabase, user.id);
    if (![...roles].some((r) => ADMIN_ROLES.has(r))) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('error', 'admin_required');
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (pathname.startsWith('/organizer')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    const roles = await activeRoles(supabase, user.id);
    if (![...roles].some((r) => ORGANIZER_ROLES.has(r))) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'organizer_required');
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
