import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Inbox } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  actionHref?: string;
}

export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="mx-auto my-8 flex w-full max-w-lg flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-[#0B0B0B] px-6 py-12 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D6B47A]/20 bg-[#D6B47A]/[0.06]">
        <Icon className="h-7 w-7 stroke-[1.5] text-[#D6B47A]" />
      </div>

      <h3 className="font-display text-xl font-bold tracking-tight text-[#F5F5F2]">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-[#77736C]">
        {description}
      </p>

      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-[#D6B47A] px-5 py-2.5 text-sm font-semibold text-[#050505] transition-all hover:bg-[#E0C38E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]/60"
        >
          {actionText}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}