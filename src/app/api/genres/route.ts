import { NextRequest } from "next/server";
import { getMovieGenres, getTVGenres } from "@/lib/tmdb";
import { jsonOk, pickEnum } from "@/lib/api-helpers";

export const revalidate = 604800; // genres are effectively static

export async function GET(request: NextRequest) {
  const type = pickEnum(request.nextUrl.searchParams.get("type"), ["movie", "tv"] as const, "movie");
  try {
    return jsonOk({ genres: type === "movie" ? await getMovieGenres() : await getTVGenres() });
  } catch (err) {
    console.error("GET /api/genres failed:", err);
    return jsonOk({ genres: [] });
  }
}
