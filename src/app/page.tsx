import { getMovieGenres, getTrendingMovies, getTrendingAll, getPopularMovies, getTopRatedMovies, getLatestReleases, getPopularTV, getAnimeSeries, getDiscoverMovies } from "@/lib/tmdb";
import { HeroBanner } from "@/components/HeroBanner";
import { MediaRow } from "@/components/MediaRow";
import { GenreGrid } from "@/components/GenreGrid";
import { ContinueWatchingSection } from "@/components/ContinueWatchingSection";
import { CatalogError } from "@/components/CatalogError";
import type { MediaItem, Paginated, Genre } from "@/lib/tmdb-types";

// Catalog rows are TMDB-backed and refresh automatically via data-cache
// revalidation (trending: 15 min, lists: 30 min) — new movies appear on their own.
export const revalidate = 900;

type Row = Paginated<MediaItem>;

/** Every row degrades independently — one flaky request never kills the page. */
async function loadCatalog() {
  const tasks = [
    getTrendingMovies("day"),
    getTrendingAll("day"),
    getTrendingMovies("week"),
    getPopularMovies(),
    getTopRatedMovies(),
    getLatestReleases(),
    getPopularTV(),
    getAnimeSeries(),
    getMovieGenres(),
    getDiscoverMovies({ genre: 28, minVotes: 100 }),
    getDiscoverMovies({ genre: 35, minVotes: 100 }),
    getDiscoverMovies({ genre: "53,9648", minVotes: 100 }),
    getDiscoverMovies({ genre: 27, minVotes: 100 }),
    getDiscoverMovies({ genre: 10749, minVotes: 100 }),
    getDiscoverMovies({ genre: 878, minVotes: 100 }),
    getDiscoverMovies({ genre: 99, minVotes: 50 }),
  ] as const;

  const settled = await Promise.allSettled(tasks.map((t) => t));
  const value = (i: number): Row =>
    settled[i].status === "fulfilled" ? (settled[i] as PromiseFulfilledResult<Row>).value : { page: 1, results: [], totalPages: 1, totalResults: 0 };

  const genres: Genre[] = settled[8].status === "fulfilled" ? (settled[8] as PromiseFulfilledResult<Genre[]>).value : [];
  return {
    trendingDay: value(0),
    trendingAll: value(1),
    trendingWeek: value(2),
    popular: value(3),
    topRated: value(4),
    latest: value(5),
    popularTV: value(6),
    animeSeries: value(7),
    genres,
    action: value(9),
    comedy: value(10),
    thriller: value(11),
    horror: value(12),
    romance: value(13),
    sciFi: value(14),
    docs: value(15),
  };
}

export default async function HomePage() {
  const data = await loadCatalog();
  const genreMap = Object.fromEntries(data.genres.map((g) => [g.id, g.name]));
  const heroItems = data.trendingDay.results.filter((m) => m.backdropPath).slice(0, 6);

  if (!heroItems.length) {
    return <CatalogError />;
  }

  return (
    <div className="pb-8">
      <HeroBanner items={heroItems} genreMap={genreMap} />

      <div className="relative z-10 -mt-10 space-y-12 sm:space-y-14">
        <ContinueWatchingSection />

        <MediaRow title="Trending Now" items={data.trendingAll.results.slice(0, 20)} genreMap={genreMap} showMediaType exploreHref="/movies?sort=trending" />
        <MediaRow title="Popular Movies" items={data.popular.results} genreMap={genreMap} exploreHref="/movies" />
        <MediaRow title="Top Rated Movies" items={data.topRated.results} genreMap={genreMap} exploreHref="/movies?sort=vote_average.desc" />
        <MediaRow title="Latest Releases" items={data.latest.results} genreMap={genreMap} exploreHref="/movies?sort=primary_release_date.desc" />
        <MediaRow title="Popular TV Shows" items={data.popularTV.results} genreMap={genreMap} exploreHref="/tv" />
        <MediaRow title="Anime Collection" items={data.animeSeries.results} genreMap={genreMap} exploreHref="/anime" />
        <MediaRow title="Recommended For You" items={data.trendingWeek.results.slice(0, 20)} genreMap={genreMap} exploreHref="/movies" />
        <MediaRow title="Action & Adventure" items={data.action.results} genreMap={genreMap} exploreHref="/genres/28?type=movie" />
        <MediaRow title="Comedy" items={data.comedy.results} genreMap={genreMap} exploreHref="/genres/35?type=movie" />
        <MediaRow title="Thriller & Mystery" items={data.thriller.results} genreMap={genreMap} exploreHref="/genres/53?type=movie" />
        <MediaRow title="Horror" items={data.horror.results} genreMap={genreMap} exploreHref="/genres/27?type=movie" />
        <MediaRow title="Romance" items={data.romance.results} genreMap={genreMap} exploreHref="/genres/10749?type=movie" />
        <MediaRow title="Sci-Fi" items={data.sciFi.results} genreMap={genreMap} exploreHref="/genres/878?type=movie" />
        <MediaRow title="Documentaries" items={data.docs.results} genreMap={genreMap} exploreHref="/genres/99?type=movie" />

        {data.genres.length > 0 && <GenreGrid genres={data.genres.slice(0, 12)} />}
      </div>
    </div>
  );
}
