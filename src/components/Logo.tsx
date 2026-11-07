import Link from "next/link";
import clsx from "clsx";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="CtrlPass home">
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-deep shadow-glow transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4 translate-x-[1.5px]" aria-hidden>
          <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.63-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14z" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-[22px] font-bold leading-none tracking-tight text-white">
          Ctrl<span className="text-brand-peach">Pass</span>
        </span>
      )}
    </Link>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "relative grid place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-deep",
        className
      )}
    >
      <svg viewBox="0 0 24 24" fill="white" className="h-[45%] w-[45%] translate-x-[6%]" aria-hidden>
        <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.63-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14z" />
      </svg>
    </span>
  );
}
