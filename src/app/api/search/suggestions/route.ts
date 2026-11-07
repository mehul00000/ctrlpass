import { NextRequest } from "next/server";
import { getSearchSuggestions } from "@/lib/tmdb";
import { jsonError, jsonOk, sanitizeQuery } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/** Fast debounced suggestions for the navbar search. */
export async function GET(request: NextRequest) {
  const query = sanitizeQuery(request.nextUrl.searchParams.get("q"));
  if (query.length < 2) return jsonOk({ results: [] });

  try {
    return jsonOk({ results: await getSearchSuggestions(query) });
  } catch (err) {
    console.error("GET /api/search/suggestions failed:", err);
    return jsonError(502, "Suggestion lookup failed.");
  }
}
