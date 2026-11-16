import { AlertTriangle } from 'lucide-react';

export default function ConfigNotice() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#D6B47A]/20 bg-[#111111] px-4 py-4 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D6B47A]/20 bg-[#D6B47A]/[0.06]">
        <AlertTriangle className="h-4 w-4 text-[#D6B47A]" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#F5F5F2]">
          Supabase configuration required
        </p>

        <p className="mt-1 text-xs leading-relaxed text-[#A7A39B]">
          CtrlPass is running against the live schema with no mock fallback.
          Configure the required Supabase environment variables to enable
          production database operations.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="rounded-lg border border-white/[0.07] bg-[#080808] px-2 py-1 font-mono text-[10px] text-[#D6B47A]">
            NEXT_PUBLIC_SUPABASE_URL
          </code>

          <code className="rounded-lg border border-white/[0.07] bg-[#080808] px-2 py-1 font-mono text-[10px] text-[#D6B47A]">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>

          <span className="text-[10px] text-[#77736C]">
            apps/web/.env.local
          </span>
        </div>
      </div>
    </div>
  );
}