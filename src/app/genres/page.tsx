import type { Metadata } from "next";
import Link from "next/link";
import { getMovieGenres, getTVGenres } from "@/lib/tmdb";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Genres",
  description: "Browse movies and TV shows by genre — action, comedy, horror, sci-fi and more.",
};

export const revalidate = 604800;

const ICONS: Record<string, string> = {
  Action: "💥",
  Adventure: "🗺️",
  Animation: "🎨",
  Comedy: "😂",
  Crime: "🕵️",
  Documentary: "🎥",
  Drama: "🎭",
  Family: "👨‍👩‍👧",
  Fantasy: "🐉",
  History: "🏛️",
  Horror: "👻",
  Music: "🎵",
  Mystery: "🔍",
  Romance: "❤️",
  "Science Fiction": "🚀",
  "Sci-Fi & Fantasy": "🧝",
  "Action & Adventure": "⚔️",
  Thriller: "🔪",
  War: "🎖️",
  Western: "🤠",
};

const GRADIENTS = [
  "from-[#CD1C18] to-[#38000A]",
  "from-[#9B1313] to-[#1d0004]",
  "from-[#CD1C18]/80 to-[#9B1313]",
  "from-[#FFA896]/25 to-[#CD1C18]",
  "from-[#9B1313] to-[#38000A]",
  "from-[#CD1C18] to-[#57060c]",
];

export default async function GenresPage() {
  const [movieGenres, tvGenres] = await Promise.all([getMovieGenres(), getTVGenres()]);
  const tvNameSet = new Set(tvGenres.map((g) => g.name));

  return (
    <>
      <PageHeader
        eyebrow="Explore"
        title="Browse by Genre"
        description="Every genre in the catalog — pick one to dive into its movies and series with full filtering."
      />
      <div className="container-page space-y-12 py-12">
        <section>
          <h2 className="section-title mb-5">Movie Genres</h2>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {movieGenres.map((genre, i) => (
              <GenreCard key={genre.id} genre={genre} gradient={GRADIENTS[i % GRADIENTS.length]} hasTV={tvNameSet.has(genre.name)} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-title mb-5">TV-Only Genres</h2>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {tvGenres
              .filter((g) => !movieGenres.some((m) => m.name === g.name))
              .map((genre, i) => (
                <GenreCard key={genre.id} genre={genre} gradient={GRADIENTS[(i + 2) % GRADIENTS.length]} hasTV />
              ))}
          </div>
        </section>
      </div>
    </>
  );
}

function GenreCard({
  genre,
  gradient,
  hasTV,
}: {
  genre: { id: number; name: string };
  gradient: string;
  hasTV?: boolean;
}) {
  return (
    <Link
      href={`/genres/${genre.id}?type=movie`}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover`}
    >
      <span className="text-2xl">{ICONS[genre.name] ?? "🎬"}</span>
      <p className="mt-2 font-display text-base font-semibold text-white">{genre.name}</p>
      {hasTV && <p className="text-[11px] text-white/60">Movies & TV</p>}
      <span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
    </Link>
  );
}
