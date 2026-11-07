"use client";

// ---------------------------------------------------------------------------
// Mobile bottom navigation — the professional app-style footer for phones.
// Contains every primary destination that used to live in the hamburger
// drawer. Hidden on desktop (lg+) where the top navbar takes over, and on
// watch pages where playback should be distraction-free.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Film, Ghost, LayoutGrid, ListVideo, Tv } from "lucide-react";
import clsx from "clsx";

const ITEMS = [
  { label: "Home", href: "/", icon: Clapperboard },
  { label: "Movies", href: "/movies", icon: Film },
  { label: "TV", href: "/tv", icon: Tv },
  { label: "Anime", href: "/anime", icon: Ghost },
  { label: "Genres", href: "/genres", icon: LayoutGrid },
  { label: "My List", href: "/my-list", icon: ListVideo },
];

export function MobileNav() {
  const pathname = usePathname();

  // Playback pages are distraction-free — no tab bar during movies/shows.
  if (pathname.startsWith("/watch")) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#2b0008]/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      <ul className="grid grid-cols-6">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative flex flex-col items-center gap-1 py-2.5 transition-colors",
                  active ? "text-brand-peach" : "text-neutral-400 hover:text-white"
                )}
              >
                {active && (
                  <span className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand" />
                )}
                <item.icon className={clsx("h-5 w-5", active && "drop-shadow-[0_0_6px_rgba(255,168,150,0.35)]")} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
