import { ConvexHttpClient } from "convex/browser";

/*
 * Convex client singleton (replaces the Supabase browser client).
 *
 * Auth: the client pulls a Clerk JWT (template "convex") for every request via
 * the token-provider registered on first use in the browser. Convex validates
 * it against the Clerk issuer configured in convex/auth.config.ts.
 */

export const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
export const isConvexConfigured = Boolean(convexUrl);

let client: ConvexHttpClient | null = null;
let authWired = false;

export function getConvexClient(): ConvexHttpClient {
  if (!isConvexConfigured) {
    throw new Error(
      "Convex is not configured. Set NEXT_PUBLIC_CONVEX_URL to connect the backend.",
    );
  }
  if (!client) {
    client = new ConvexHttpClient(convexUrl);
  }
  return client;
}

/** Fetch a Clerk JWT (template "convex") for the current session, if any. */
export async function getClerkConvexToken(): Promise<string> {
  if (typeof window === "undefined") return "";
  const clerk = (window as unknown as { Clerk?: any }).Clerk;
  try {
    return (await clerk?.session?.getToken({ template: "convex" })) ?? "";
  } catch {
    return "";
  }
}

/**
 * Browser client with a fresh Clerk token attached. Clerk caches tokens until
 * they near expiry, so calling this per service call is cheap.
 */
export async function authedClient(): Promise<ConvexHttpClient> {
  const c = getConvexClient();
  const token = await getClerkConvexToken();
  if (token) {
    c.setAuth(token);
  }
  return c;
}

/** True when the browser has a live Clerk session (used to gate UI affordances). */
export function hasClerkSession(): boolean {
  if (typeof window === "undefined") return false;
  const clerk = (window as unknown as { Clerk?: any }).Clerk;
  return Boolean(clerk?.session?.user);
}

/* ─────────────────────── Convex → Postgres shape mapping ───────────────────────
 * The Convex schema uses camelCase; every UI component (and @ctrlpass/types) was
 * written against the original snake_case Postgres columns. Services therefore
 * convert documents back to the snake_case shapes the UI already consumes.
 */

function toSnake(key: string): string {
  return key.replace(/([A-Z])/g, "_$1").toLowerCase();
}

export function snakeize<T = any>(doc: any): T {
  if (doc === null || doc === undefined) return doc;
  if (Array.isArray(doc)) return doc.map(snakeize) as unknown as T;
  if (typeof doc !== "object") return doc;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc as Record<string, unknown>)) {
    if (key === "_creationTime") continue;
    if (key === "_id") {
      out.id = value;
      continue;
    }
    const snakeKey = toSnake(key);
    if (typeof value === "number" && /_at$|_deadline$/.test(snakeKey)) {
      // Postgres exposed timestamptz as ISO strings.
      out[snakeKey] = new Date(value).toISOString();
      continue;
    }
    out[snakeKey] = snakeize(value);
  }
  return out as T;
}

/** Convex error messages can leak internal codes; surface a clean message. */
export function convexErrorMessage(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  return raw.replace(/^Error:/, "").trim();
}
