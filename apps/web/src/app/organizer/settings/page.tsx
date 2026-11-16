'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Mail,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { organizerService } from '@/services/organizer';
import { isSupabaseConfigured } from '@/lib/supabase';
import { brandAssets } from '@/lib/brand';

export default function SettingsPage() {
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [verification, setVerification] = useState('PENDING');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [bootstrapping, setBootstrapping] = useState(false);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) {
        setError(
          'Connect Supabase before editing organization settings.'
        );
        setLoading(false);
        return;
      }

      try {
        setError(null);

        const org = await organizerService.getMyOrganizer();

        if (!org) {
          setNeedsBootstrap(true);
          return;
        }

        setOrganizerId(org.id);
        setOrgName(org.name);
        setEmail(org.email ?? '');
        setCity(org.city ?? '');
        setVerification(org.verification_status);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load organization.'
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!organizerId) return;

    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const updated =
        await organizerService.updateMyOrganizer(organizerId, {
          name: orgName.trim(),
          email: email.trim(),
          city: city.trim(),
        });

      setOrgName(updated.name);
      setEmail(updated.email ?? '');
      setCity(updated.city ?? '');
      setVerification(updated.verification_status);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save organization.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBootstrap = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!newOrgName.trim()) {
      setError('Enter an organization name.');
      return;
    }

    setBootstrapping(true);
    setError(null);

    try {
      const org =
        await organizerService.bootstrapMyOrganizer(
          newOrgName.trim()
        );

      setOrganizerId(org.id);
      setOrgName(org.name);
      setEmail(org.email ?? '');
      setCity(org.city ?? '');
      setVerification(org.verification_status);

      setNeedsBootstrap(false);
      setNewOrgName('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not create organization.'
      );
    } finally {
      setBootstrapping(false);
    }
  };

  return (
    <DashboardLayout
      role="organizer"
      title="Organization Settings"
      subtitle="Manage your organizer identity, contact details, and verification status."
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D6B47A]/15 bg-[#D6B47A]/[0.06] text-[#D6B47A]">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#77736C]">
                  Organizer Workspace
                </p>

                <h2 className="mt-1 text-base font-semibold text-[#F5F5F2]">
                  Organization identity
                </h2>
              </div>
            </div>

            {organizerId && (
              <div className="flex items-center gap-2 self-start rounded-full border border-[#7FBF9A]/15 bg-[#7FBF9A]/[0.05] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7FBF9A]" />
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#7FBF9A]">
                  Profile Active
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main settings */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-6 sm:p-8">
            {loading && (
              <div className="flex min-h-[280px] items-center justify-center">
                <div className="flex items-center gap-3 text-xs text-[#77736C]">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading organization...
                </div>
              </div>
            )}

            {!loading && error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#D96B6B]/20 bg-[#D96B6B]/[0.06] p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D96B6B]" />

                <p className="text-xs leading-5 text-[#D96B6B]">
                  {error}
                </p>
              </div>
            )}

            {saved && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#7FBF9A]/20 bg-[#7FBF9A]/[0.06] p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#7FBF9A]" />

                <div>
                  <p className="text-xs font-semibold text-[#7FBF9A]">
                    Organization profile saved
                  </p>

                  <p className="mt-1 text-xs text-[#7FBF9A]/70">
                    Your latest organization details have been saved.
                  </p>
                </div>
              </div>
            )}

            {/* Bootstrap */}
            {!loading && needsBootstrap && (
              <form
                onSubmit={handleBootstrap}
                className="space-y-7"
              >
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#D6B47A]">
                    Initial Setup
                  </p>

                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-[#F5F5F2]">
                    Create your organization
                  </h3>

                  <p className="mt-2 max-w-xl text-xs leading-5 text-[#77736C]">
                    Your organizer account is active, but no organization
                    is linked yet. Create your organization to start
                    managing and publishing events.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="new-org-name"
                    className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]"
                  >
                    Organization Name
                  </label>

                  <input
                    id="new-org-name"
                    type="text"
                    required
                    minLength={2}
                    value={newOrgName}
                    onChange={(event) =>
                      setNewOrgName(event.target.value)
                    }
                    placeholder="e.g. Sunrise Collective"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#050505] px-4 py-3 text-sm text-[#F5F5F2] placeholder:text-[#55524D] outline-none transition focus:border-[#D6B47A]/50"
                  />
                </div>

                <div className="flex justify-end border-t border-white/[0.06] pt-6">
                  <button
                    type="submit"
                    disabled={
                      bootstrapping || !newOrgName.trim()
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#D6B47A] px-5 py-3 text-xs font-semibold text-[#050505] transition hover:bg-[#E1C58F] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {bootstrapping ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Building2 className="h-3.5 w-3.5" />
                        Create Organization
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Existing organization */}
            {!loading && organizerId && (
              <form onSubmit={handleSave} className="space-y-7">
                {/* Identity */}
                <div className="flex flex-col gap-5 border-b border-white/[0.06] pb-7 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Image
                      src={brandAssets.appIcon}
                      alt="CtrlPass organizer"
                      width={60}
                      height={60}
                      className="rounded-2xl border border-white/[0.08] object-cover"
                    />

                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                        Organization
                      </p>

                      <h3 className="mt-1 text-base font-semibold text-[#F5F5F2]">
                        {orgName || 'Organization'}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start rounded-full border border-[#D6B47A]/15 bg-[#D6B47A]/[0.05] px-3 py-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#D6B47A]" />

                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#D6B47A]">
                      {verification}
                    </span>
                  </div>
                </div>

                {/* Organization name + email */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="organization-name"
                      className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]"
                    >
                      Organization Name
                    </label>

                    <input
                      id="organization-name"
                      type="text"
                      required
                      value={orgName}
                      onChange={(event) =>
                        setOrgName(event.target.value)
                      }
                      className="w-full rounded-xl border border-white/[0.08] bg-[#050505] px-4 py-3 text-sm text-[#F5F5F2] outline-none transition focus:border-[#D6B47A]/50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="organization-email"
                      className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]"
                    >
                      Primary Contact Email
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#55524D]" />

                      <input
                        id="organization-email"
                        type="email"
                        required
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        className="w-full rounded-xl border border-white/[0.08] bg-[#050505] py-3 pl-10 pr-4 text-sm text-[#F5F5F2] outline-none transition focus:border-[#D6B47A]/50"
                      />
                    </div>
                  </div>
                </div>

                {/* City */}
                <div>
                  <label
                    htmlFor="organization-city"
                    className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]"
                  >
                    City / Base Location
                  </label>

                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#55524D]" />

                    <input
                      id="organization-city"
                      type="text"
                      value={city}
                      onChange={(event) =>
                        setCity(event.target.value)
                      }
                      placeholder="e.g. New Delhi"
                      className="w-full rounded-xl border border-white/[0.08] bg-[#050505] py-3 pl-10 pr-4 text-sm text-[#F5F5F2] placeholder:text-[#55524D] outline-none transition focus:border-[#D6B47A]/50"
                    />
                  </div>
                </div>

                {/* Verification */}
                <div className="rounded-xl border border-white/[0.06] bg-[#050505] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#D6B47A]/10 bg-[#D6B47A]/[0.05]">
                      <ShieldCheck className="h-4 w-4 text-[#D6B47A]" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#F5F5F2]">
                        Verification Status
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#77736C]">
                        Your current organizer verification state is{' '}
                        <span className="font-medium text-[#D6B47A]">
                          {verification}
                        </span>
                        . Verification is managed by the platform and
                        is not editable from this profile.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] leading-5 text-[#55524D]">
                    Changes apply to your organizer profile and related
                    organizer-facing information.
                  </p>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D6B47A] px-5 py-3 text-xs font-semibold text-[#050505] transition hover:bg-[#E1C58F] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save Organization Profile
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Side information */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#D6B47A]">
                  <Building2 className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#F5F5F2]">
                    Organizer Profile
                  </h3>

                  <p className="text-[11px] text-[#55524D]">
                    Identity & contact
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#77736C]">
                    Name
                  </p>

                  <p className="mt-1 text-sm text-[#A7A39B]">
                    {orgName || 'Not configured'}
                  </p>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#77736C]">
                    Contact
                  </p>

                  <p className="mt-1 break-all text-sm text-[#A7A39B]">
                    {email || 'Not configured'}
                  </p>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#77736C]">
                    Base Location
                  </p>

                  <p className="mt-1 text-sm text-[#A7A39B]">
                    {city || 'Not configured'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#D6B47A]/10 bg-[#D6B47A]/[0.035] p-5">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#D6B47A]" />

                <div>
                  <p className="text-xs font-semibold text-[#F5F5F2]">
                    Verification
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#77736C]">
                    Verification status is controlled by the organizer
                    verification workflow and cannot be changed from
                    this page.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}