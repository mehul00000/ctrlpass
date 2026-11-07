import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WatchMedia from "@/components/player/WatchMedia";

/**
 * Spec-shaped TV episode route: /watch/tv/[tmdbId]/[season]/[episode]
 */
interface Props {
  params: Promise<{ id: string; season: string; episode: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Watch" };
}

export default async function WatchEpisodePage({ params }: Props) {
  const { id, season, episode } = await params;
  const tmdbId = Number(id);
  const seasonNum = Number(season);
  const episodeNum = Number(episode);
  if (!Number.isInteger(tmdbId) || !Number.isInteger(seasonNum) || !Number.isInteger(episodeNum)) {
    notFound();
  }

  return <WatchMedia type="tv" tmdbId={tmdbId} season={seasonNum} episode={episodeNum} />;
}
