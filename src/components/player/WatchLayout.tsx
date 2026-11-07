"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Floating top bar for the watch page (client island inside a server page).
 */
export function ContainerBreak({ detailsHref, title }: { detailsHref: string; title: string }) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1500px] items-center gap-3 px-3 sm:px-6">
        <Link
          href={detailsHref}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <p className="truncate text-sm font-semibold text-white">{title}</p>
      </div>
    </div>
  );
}
