import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[380px] w-[560px] -translate-x-1/2 rounded-full bg-brand/20 blur-[140px]"
      />
      <LogoMark className="relative h-16 w-16" />
      <h1 className="relative mt-6 font-display text-6xl font-bold text-white sm:text-7xl">404</h1>
      <p className="relative mt-3 max-w-md text-neutral-400">
        This scene got cut. The title you’re looking for doesn’t exist or the link is broken.
      </p>
      <div className="relative mt-8 flex gap-3">
        <Link href="/" className="btn-primary">
          Back to Home
        </Link>
        <Link href="/search" className="btn-secondary">
          Search Titles
        </Link>
      </div>
    </div>
  );
}
