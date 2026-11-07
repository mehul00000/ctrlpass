import Link from "next/link";
import { Logo } from "./Logo";

const FOOTER_LINKS: Array<{ heading: string; links: Array<{ label: string; href: string }> }> = [
  {
    heading: "Browse",
    links: [
      { label: "Home", href: "/" },
      { label: "Movies", href: "/movies" },
      { label: "TV Shows", href: "/tv" },
      { label: "Anime", href: "/anime" },
      { label: "Genres", href: "/genres" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "My List", href: "/my-list" },
      { label: "Profile", href: "/profile" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "Sign In", href: "/sign-in" },
      { label: "Sign Up", href: "/sign-up" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-[#2b0008]">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-neutral-400">
              Your World of Cinema. Discover trending movies, series and anime —
              automatically updated with fresh titles every day.
            </p>
          </div>
          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-peach">
                {group.heading}
              </h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/5 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CtrlPass. All rights reserved.</p>
          <p className="max-w-xl leading-relaxed">
            This product uses the TMDB API but is not endorsed or certified by TMDB.{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-neutral-600 underline-offset-2 transition-colors hover:text-brand-peach"
            >
              themoviedb.org
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
