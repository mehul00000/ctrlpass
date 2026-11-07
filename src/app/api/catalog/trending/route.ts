import { getTrendingAll } from "@/lib/tmdb";
import { jsonError, jsonOk } from "@/lib/api-helpers";

export const revalidate = 900;

/** GET /api/catalog/trending — mixed trending (movies + TV). */
export async function GET() {
  try {
    return jsonOk(await getTrendingAll("day"));
  } catch (err) {
    console.error("GET /api/catalog/trending failed:", err);
    return jsonError(502, "TMDB request failed.");
  }
}
