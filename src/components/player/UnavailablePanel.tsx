"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { ReportButton } from "./ReportButton";

/** Honest unavailable state with Retry / Back to Details / Report Issue. */
export function UnavailablePanel({
  reason,
  backHref,
  tmdbId,
  mediaType,
}: {
  reason: string;
  backHref: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
}) {
  return (
    <div className="pt-16">
      <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-brand/20 bg-brand/5 px-8 py-12 text-center">
        <AlertTriangle className="mb-4 h-10 w-10 text-brand-peach" />
        <h3 className="font-display text-lg font-semibold text-white">{reason}</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">
          Playback availability is provider-side. You can retry, go back to the details page, or
          report the issue so an administrator can review it.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => window.location.reload()} className="btn-primary !py-2">
            Retry
          </button>
          <Link href={backHref} className="btn-secondary !py-2">
            Back to Details
          </Link>
          <ReportButton tmdbId={tmdbId} mediaType={mediaType} />
        </div>
      </div>
    </div>
  );
}
