import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Genre } from "@/lib/tmdb-types";

const GRADIENTS = [
  "from-[#CD1C18] to-[#38000A]",
  "from-[#9B1313] to-[#1d0004]",
  "from-[#CD1C18]/80 to-[#9B1313]",
  "from-[#FFA896]/25 to-[#CD1C18]",
  "from-[#9B1313] to-[#38000A]",
  "from-[#CD1C18] to-[#57060c]",
];

/** "Browse By Genre" grid — links into the dynamic genre explorer. */
export function GenreGrid({ genres }: { genres: Genre[] }) {
  return (
    <section>
      <div className="container-page mb-5">
        <h2 className="section-title">
          Browse By Genre
          <span className="mt-1.5 block h-1 w-10 rounded-full bg-brand" />
        </h2>
      </div>
      <div className="container-page grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {genres.map((genre, i) => (
          <Link
            key={genre.id}
            href={`/genres/${genre.id}?type=movie`}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${
              GRADIENTS[i % GRADIENTS.length]
            } p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover`}
          >
            <span className="font-display text-base font-semibold text-white sm:text-lg">
              {genre.name}
            </span>
            <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-white/60 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white" />
            <span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100 sm:opacity-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
