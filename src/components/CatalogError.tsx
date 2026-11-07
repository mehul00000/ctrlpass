"use client";

import { AlertTriangle } from "lucide-react";

/** Styled fallback when the TMDB catalog can't be reached right now. */
export function CatalogError({ title = "The catalog is momentarily unavailable" }: { title?: string }) {
  return (
    <div className="mx-auto my-24 flex max-w-md flex-col items-center rounded-3xl border border-brand/20 bg-brand/5 px-8 py-12 text-center">
      <AlertTriangle className="mb-4 h-10 w-10 text-brand-peach" />
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-400">
        CtrlPass fetches everything live from TMDB. The request failed after several retries —
        please try again in a moment.
      </p>
      <button onClick={() => window.location.reload()} className="btn-secondary mt-6">
        Retry
      </button>
    </div>
  );
}
