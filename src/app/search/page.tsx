import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchClient } from "@/components/search/SearchClient";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Search",
  description: "Search movies, TV shows, anime and people across the entire TMDB catalog.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <>
      <PageHeader eyebrow="Find Anything" title="Search" description="Instant results across movies, series, anime and people." />
      <div className="pt-10">
        <Suspense fallback={<div className="container-page py-10 text-center text-neutral-500">Loading search…</div>}>
          <SearchClient initialQuery={q ?? ""} />
        </Suspense>
      </div>
    </>
  );
}
