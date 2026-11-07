"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  ChevronDown,
  Clapperboard,
  Film,
  Ghost,
  LayoutGrid,
  ListVideo,
  Search,
  Settings,
  Tv,
  User as UserIcon,
  X,
} from "lucide-react";
import clsx from "clsx";
import { Logo } from "./Logo";
import { useCurrentUser } from "@/lib/user-context";
import type { MediaItem } from "@/lib/tmdb-types";
import { PosterImage } from "./PosterImage";

const NAV_LINKS = [
  { label: "Home", href: "/", icon: Clapperboard },
  { label: "Movies", href: "/movies", icon: Film },
  { label: "TV Shows", href: "/tv", icon: Tv },
  { label: "Anime", href: "/anime", icon: Ghost },
  { label: "Genres", href: "/genres", icon: LayoutGrid },
  { label: "My List", href: "/my-list", icon: ListVideo },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useCurrentUser();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // The admin decision comes from the server (ADMIN_EMAILS) — the UI only
  // hides the shortcut; /admin itself re-verifies on every request.
  useEffect(() => {
    if (loading || !user.signedIn) {
      setIsAdmin(false);
      return;
    }
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(Boolean(d.isAdmin)))
      .catch(() => setIsAdmin(false));
  }, [loading, user.signedIn, user.userId]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
    [pathname]
  );

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/5 bg-brand-dark/90 shadow-lg shadow-black/20 backdrop-blur-xl"
          : "bg-gradient-to-b from-[#38000acc] via-[#38000a66] to-transparent"
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <div className="flex items-center gap-8">
          <Logo />
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={clsx(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "text-white"
                      : "text-neutral-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-brand/90"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <QuickSearch />
          </div>
          <Link
            href="/search"
            aria-label="Search"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition-colors hover:bg-white/10 sm:hidden"
          >
            <Search className="h-5 w-5" />
          </Link>

          {/* Profile / auth */}
          {!loading && user.signedIn ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-white/10"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                {user.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.imageUrl}
                    alt={user.name}
                    className="h-8 w-8 rounded-full border border-white/20 object-cover"
                  />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-deep text-sm font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <ChevronDown className="hidden h-4 w-4 text-neutral-300 sm:block" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#2b0008] p-1.5 shadow-2xl shadow-black/50"
                    role="menu"
                  >
                    <div className="border-b border-white/5 px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                      {user.email && <p className="truncate text-xs text-neutral-400">{user.email}</p>}
                    </div>
                    <MenuLink href="/profile" icon={UserIcon} label="Profile" />
                    <MenuLink href="/my-list" icon={Bookmark} label="My List" />
                    {isAdmin && <MenuLink href="/admin" icon={Settings} label="Admin Dashboard" />}
                    <button
                      onClick={() => signOut()}
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-brand/20 hover:text-white"
                      role="menuitem"
                    >
                      <X className="h-4 w-4" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            !loading && (
              <Link
                href="/sign-in"
                className="btn-primary !px-5 !py-2 whitespace-nowrap text-sm shrink-0"
              >
                Sign In
              </Link>
            )
          )}

        </div>
      </nav>
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
      role="menuitem"
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Quick search — debounced TMDB suggestions directly in the navbar
// ---------------------------------------------------------------------------

function QuickSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = () => {
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center rounded-full border border-white/10 bg-white/5 transition-colors focus-within:border-brand-peach/50">
        <Search className="ml-3 h-4 w-4 shrink-0 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Search movies, shows…"
          className="w-32 bg-transparent px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none sm:w-44 md:w-56"
          aria-label="Search"
        />
      </div>

      <AnimatePresence>
        {open && (query.trim().length >= 2) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[22rem] overflow-hidden rounded-2xl border border-white/10 bg-[#2b0008]/97 shadow-2xl shadow-black/50 backdrop-blur-xl sm:w-[26rem]"
          >
            {loading && results.length === 0 ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="skeleton h-16 w-11 shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="skeleton h-3.5 w-3/4" />
                      <div className="skeleton h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <p className="p-5 text-sm text-neutral-400">No matches for “{query}”.</p>
            ) : (
              <>
                <ul className="max-h-[24rem] overflow-y-auto p-2">
                  {results.map((r) => (
                    <li key={`${r.mediaType}-${r.id}`}>
                      <Link
                        href={`/${r.mediaType}/${r.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/5"
                      >
                        <PosterImage
                          path={r.posterPath}
                          alt={r.title}
                          size="w92"
                          className="h-[68px] w-[46px] shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{r.title}</p>
                          <p className="text-xs capitalize text-neutral-400">
                            {r.mediaType === "movie" ? "Movie" : "TV Series"}
                            {r.releaseDate ? ` · ${r.releaseDate.slice(0, 4)}` : ""}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={submit}
                  className="block w-full border-t border-white/5 px-4 py-3 text-center text-sm font-medium text-brand-peach transition-colors hover:bg-white/5"
                >
                  See all results for “{query.trim()}”
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
