import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  subtext?: string;
}

export default function StatsCard({
  label,
  value,
  change,
  isPositive = true,
  icon: Icon,
  subtext,
}: StatsCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0B0B0B] p-5 transition-colors duration-300 hover:border-[#D6B47A]/20 sm:p-6">
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#D6B47A]/[0.025] blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
            {label}
          </span>

          <div className="mt-3 truncate font-display text-3xl font-bold tracking-tight text-[#F5F5F2]">
            {value}
          </div>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D6B47A]/15 bg-[#D6B47A]/[0.05] text-[#D6B47A] transition-transform duration-300 group-hover:scale-105">
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>

      {(change || subtext) && (
        <div className="relative mt-4 flex min-h-4 flex-wrap items-center gap-2 text-xs">
          {change && (
            <span
              className={`font-semibold ${
                isPositive ? 'text-[#7FBF9A]' : 'text-[#D96B6B]'
              }`}
            >
              {isPositive ? '↑' : '↓'} {change}
            </span>
          )}

          {subtext && (
            <span className="text-[#77736C]">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}