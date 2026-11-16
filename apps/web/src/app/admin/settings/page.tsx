'use client';

import DashboardLayout from '@/components/DashboardLayout';
import {
  Clock3,
  IndianRupee,
  LockKeyhole,
  Settings2,
  ShieldCheck,
} from 'lucide-react';

function SettingCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof Clock3;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
            {label}
          </p>

          <p className="mt-3 text-lg font-semibold tracking-tight text-[#F5F5F2]">
            {value}
          </p>

          <p className="mt-2 text-xs leading-relaxed text-[#77736C]">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#D6B47A]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <DashboardLayout
      role="admin"
      title="Platform Settings"
      subtitle="Operational parameters currently exposed by the platform configuration."
    >
      <div className="max-w-4xl space-y-6">
        <section className="rounded-2xl border border-[#D6B47A]/15 bg-[#0b0b0b] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D6B47A]/20 bg-[#D6B47A]/10 text-[#D6B47A]">
              <LockKeyhole className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[#F5F5F2]">
                Configuration is read-only
              </h2>

              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-[#77736C]">
                These parameters are controlled by the underlying reservation
                and payment services. This dashboard does not expose controls
                for changing them.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-[#111111] text-[#D6B47A]">
              <Settings2 className="h-3.5 w-3.5" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[#F5F5F2]">
                Booking Parameters
              </h2>

              <p className="mt-0.5 text-xs text-[#77736C]">
                Current operational values visible to the admin workspace.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SettingCard
              label="Ticket Hold Timeout"
              value="10 minutes"
              description="Current reservation hold duration shown by the platform configuration."
              icon={Clock3}
            />

            <SettingCard
              label="Booking Fee"
              value="Calculated at checkout"
              description="The applicable fee is calculated during checkout and stored with the booking."
              icon={IndianRupee}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#7FBF9A]">
              <ShieldCheck className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-semibold text-[#F5F5F2]">
                Configuration safety
              </p>

              <p className="mt-1 text-xs leading-relaxed text-[#77736C]">
                Platform settings are intentionally not editable from this
                interface. Changes should be made through the service
                configuration that owns the corresponding behavior.
              </p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}