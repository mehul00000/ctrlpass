import { ConvexHttpClient } from 'convex/browser';
import { ENV, isBackendConfigured } from '../config/env';

export { isBackendConfigured };

/*
 * Convex client singleton (replaces the Supabase RN client).
 *
 * Auth: a Clerk JWT (template "convex") is attached per call. The token
 * provider is registered by AuthProvider (inside ClerkProvider) because Clerk
 * token access requires the Clerk instance.
 */

type TokenProvider = () => Promise<string | null>;

let client: ConvexHttpClient | null = null;
let tokenProvider: TokenProvider | null = null;

export function setClerkTokenProvider(provider: TokenProvider) {
  tokenProvider = provider;
}

export function getConvexClient(): ConvexHttpClient {
  if (!isBackendConfigured()) {
    throw new Error(
      'Convex is not configured. Set EXPO_PUBLIC_CONVEX_URL in apps/mobile/.env.'
    );
  }
  if (!client) {
    client = new ConvexHttpClient(ENV.CONVEX_URL);
  }
  return client;
}

/** Client with a fresh Clerk token attached (Clerk caches until near expiry). */
export async function authedClient(): Promise<ConvexHttpClient> {
  const c = getConvexClient();
  if (tokenProvider) {
    const token = await tokenProvider();
    if (token) c.setAuth(token);
  }
  return c;
}

/* ─────────────── Convex → snake_case shape mapping (matches old schema) ─────────────── */

function toSnake(key: string): string {
  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
}

export function snakeize<T = any>(doc: any): T {
  if (doc === null || doc === undefined) return doc;
  if (Array.isArray(doc)) return doc.map(snakeize) as unknown as T;
  if (typeof doc !== 'object') return doc;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc as Record<string, unknown>)) {
    if (key === '_creationTime') continue;
    if (key === '_id') {
      out.id = value;
      continue;
    }
    const snakeKey = toSnake(key);
    if (typeof value === 'number' && /_at$|_deadline$/.test(snakeKey)) {
      out[snakeKey] = new Date(value).toISOString();
      continue;
    }
    out[snakeKey] = snakeize(value);
  }
  return out as T;
}
