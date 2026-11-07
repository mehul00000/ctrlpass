"use client";

import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useState } from "react";
import { Flag } from "lucide-react";

/** Report-issue action for the watch page's unavailable state. */
export function ReportButton({
  tmdbId,
  mediaType,
}: {
  tmdbId: number;
  mediaType: "movie" | "tv";
}) {
  const createReport = useMutation(api.userData.createReport);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const send = async () => {
    setState("sending");
    try {
      await createReport({
        tmdbId,
        mediaType,
        issueType: "playback",
        description: "Playback unavailable — reported from the watch page.",
      });
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
        <Flag className="h-4 w-4" /> Report sent — thank you!
      </span>
    );
  }

  return (
    <button onClick={send} disabled={state === "sending"} className="btn-secondary disabled:opacity-50">
      <Flag className="h-4 w-4" />
      {state === "sending" ? "Sending…" : state === "error" ? "Failed — try again" : "Report Issue"}
    </button>
  );
}
