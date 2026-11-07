import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WatchMedia from "@/components/player/WatchMedia";

interface Props {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ season?: string; episode?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Watch" };
}

export default async function WatchPage({ params, searchParams }: Props) {
  const { type, id } = await params;
  const sp = await searchParams;
  if (type !== "movie" && type !== "tv") notFound();

  const tmdbId = Number(id);
  if (!Number.isInteger(tmdbId)) notFound();

  return (
    <WatchMedia
      type={type}
      tmdbId={tmdbId}
      season={sp.season ? Number(sp.season) : undefined}
      episode={sp.episode ? Number(sp.episode) : undefined}
    />
  );
}
