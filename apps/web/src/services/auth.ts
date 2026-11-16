import type { SupabaseClient } from '@supabase/supabase-js';

export type AppRole = 'ATTENDEE' | 'VOLUNTEER' | 'ORGANIZER' | 'ADMIN';

export async function getSession(client: SupabaseClient) {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getRoles(client: SupabaseClient, userId: string): Promise<AppRole[]> {
  const { data, error } = await client
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE');
  if (error) throw error;
  return (data ?? []).map((row) => row.role as AppRole);
}

export function hasAnyRole(roles: AppRole[], allowed: AppRole[]) {
  return allowed.some((role) => roles.includes(role));
}

export async function requireRole(client: SupabaseClient, allowed: AppRole[]) {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Not authenticated');

  const roles = await getRoles(client, user.id);
  if (!hasAnyRole(roles, allowed)) {
    throw new Error('Insufficient permissions');
  }
  return { user, roles };
}
