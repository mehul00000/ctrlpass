'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  FileText,
  Layers3,
  Save,
  AlertCircle,
  ShieldCheck,
  X,
} from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';
import { eventService } from '@/services/events';

const categories = [
  'Technology',
  'Music',
  'Sports',
  'Arts',
  'Business',
  'Festival',
  'Conference',
];

const editableStatuses = [
  'DRAFT',
  'SUBMITTED_FOR_REVIEW',
  'PUBLISHED',
  'CANCELLED',
];

function formatStatus(status: string) {
  return status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(status: string) {
  switch (status) {
    case 'PUBLISHED':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
    case 'CANCELLED':
      return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
    case 'SUBMITTED_FOR_REVIEW':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
    default:
      return 'border-white/10 bg-white/[0.04] text-white/60';
  }
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Technology');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('DRAFT');

  useEffect(() => {
    async function load() {
      try {
        setError(null);

        const ev = await eventService.getById(eventId);

        if (!ev) {
          setError('Event could not be found.');
          return;
        }

        setName(ev.name);
        setCategory(ev.category || 'Technology');
        setDescription(ev.description || '');
        setStatus(ev.status);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to load event configuration.';

        setError(message);
      } finally {
        setInitialLoading(false);
      }
    }

    if (eventId) {
      void load();
    }
  }, [eventId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Event title is required.');
      return;
    }

    setError(null);
    setSaved(false);
    setLoading(true);

    try {
      await eventService.updateEvent(eventId, {
        name: name.trim(),
        category,
        description: description.trim(),
        status: status as never,
      });

      setSaved(true);

      window.setTimeout(() => {
        router.push(`/organizer/events/${eventId}`);
      }, 500);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update event.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const hasDescription = description.trim().length > 0;

  return (
    <DashboardLayout
      role="organizer"
      title="Edit Event"
      subtitle="Update your event configuration and publishing state."
      actions={
        <Link
          href={`/organizer/events/${eventId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/75 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Event
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-6xl">
        {initialLoading ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#080808] p-12">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto mb-5 h-10 w-10 animate-pulse rounded-full border border-[#D6B47A]/30 bg-[#D6B47A]/10" />
              <p className="text-sm font-medium text-white/70">
                Loading event configuration...
              </p>
              <p className="mt-2 text-xs text-white/35">
                Fetching the latest event details.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#080808] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D6B47A]/20 bg-[#D6B47A]/10">
                  <Layers3 className="h-4 w-4 text-[#D6B47A]" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Event configuration
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Changes are saved directly to the event record.
                  </p>
                </div>
              </div>

              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${statusTone(
                  status,
                )}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {formatStatus(status)}
              </div>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-rose-200">
                    Unable to save changes
                  </p>
                  <p className="mt-1 text-xs leading-5 text-rose-200/60">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="ml-auto rounded-lg p-1 text-rose-200/50 transition hover:bg-white/5 hover:text-rose-200"
                  aria-label="Dismiss error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                  <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080808]">
                    <div className="border-b border-white/[0.07] px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                          <FileText className="h-4 w-4 text-[#D6B47A]" />
                        </div>

                        <div>
                          <h2 className="text-sm font-semibold text-white">
                            Basic information
                          </h2>
                          <p className="mt-1 text-xs text-white/35">
                            The information attendees see on the event page.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 p-6">
                      <div>
                        <label
                          htmlFor="event-name"
                          className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45"
                        >
                          Event title
                        </label>

                        <input
                          id="event-name"
                          type="text"
                          required
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Enter your event name"
                          className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#D6B47A]/60 focus:ring-1 focus:ring-[#D6B47A]/20"
                        />

                        <p className="mt-2 text-[11px] text-white/25">
                          Use a clear, recognizable title for your event.
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="event-category"
                          className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45"
                        >
                          Category
                        </label>

                        <select
                          id="event-category"
                          value={category}
                          onChange={(event) => setCategory(event.target.value)}
                          className="w-full appearance-none rounded-xl border border-white/10 bg-[#050505] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#D6B47A]/60 focus:ring-1 focus:ring-[#D6B47A]/20"
                        >
                          {categories.map((item) => (
                            <option key={item} value={item} className="bg-[#080808]">
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <label
                            htmlFor="event-description"
                            className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45"
                          >
                            Description
                          </label>

                          <span className="text-[10px] tabular-nums text-white/25">
                            {description.length} characters
                          </span>
                        </div>

                        <textarea
                          id="event-description"
                          rows={9}
                          value={description}
                          onChange={(event) =>
                            setDescription(event.target.value)
                          }
                          placeholder="Describe what attendees can expect..."
                          className="w-full resize-none rounded-xl border border-white/10 bg-[#050505] px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-[#D6B47A]/60 focus:ring-1 focus:ring-[#D6B47A]/20"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-white/[0.08] bg-[#080808]">
                    <div className="border-b border-white/[0.07] px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                          <ShieldCheck className="h-4 w-4 text-[#D6B47A]" />
                        </div>

                        <div>
                          <h2 className="text-sm font-semibold text-white">
                            Publishing state
                          </h2>
                          <p className="mt-1 text-xs text-white/35">
                            Control the current lifecycle state of this event.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <label
                        htmlFor="event-status"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45"
                      >
                        Status
                      </label>

                      <select
                        id="event-status"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="w-full appearance-none rounded-xl border border-white/10 bg-[#050505] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#D6B47A]/60 focus:ring-1 focus:ring-[#D6B47A]/20"
                      >
                        {editableStatuses.map((item) => (
                          <option
                            key={item}
                            value={item}
                            className="bg-[#080808]"
                          >
                            {formatStatus(item)}
                          </option>
                        ))}
                      </select>

                      <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                        <p className="text-xs font-medium text-white/65">
                          Current state
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${statusTone(
                              status,
                            )}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {formatStatus(status)}
                          </span>
                        </div>

                        <p className="mt-3 text-[11px] leading-5 text-white/30">
                          Event lifecycle transitions are also controlled by
                          the organizer event workflow.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="space-y-6">
                  <section className="rounded-2xl border border-white/[0.08] bg-[#080808]">
                    <div className="border-b border-white/[0.07] px-5 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                        Configuration summary
                      </p>
                    </div>

                    <div className="divide-y divide-white/[0.06]">
                      <div className="p-5">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
                          Event ID
                        </p>
                        <p className="mt-2 break-all font-mono text-[11px] text-white/55">
                          {eventId}
                        </p>
                      </div>

                      <div className="p-5">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
                          Category
                        </p>
                        <p className="mt-2 text-sm font-medium text-white/75">
                          {category}
                        </p>
                      </div>

                      <div className="p-5">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
                          Description
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              hasDescription
                                ? 'bg-emerald-400'
                                : 'bg-white/20'
                            }`}
                          />
                          <span className="text-xs text-white/55">
                            {hasDescription
                              ? 'Description added'
                              : 'No description'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[#D6B47A]/15 bg-[#D6B47A]/[0.04] p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D6B47A]/20 bg-[#D6B47A]/10">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#D6B47A]" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[#E4C995]">
                          Publishing control
                        </p>
                        <p className="mt-2 text-[11px] leading-5 text-white/40">
                          Only make an event public when its details, ticket
                          configuration, venue and schedule are ready.
                        </p>
                      </div>
                    </div>
                  </section>

                  <Link
                    href={`/organizer/events/${eventId}`}
                    className="group flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#080808] p-5 transition hover:border-white/15 hover:bg-[#0b0b0b]"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white/75">
                        View event workspace
                      </p>
                      <p className="mt-1 text-[11px] text-white/30">
                        Return to event operations.
                      </p>
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-white/30 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#D6B47A]" />
                  </Link>
                </aside>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`/organizer/events/${eventId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-xs font-semibold text-white/60 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D6B47A] px-6 py-3 text-xs font-bold text-[#090909] shadow-[0_10px_30px_rgba(214,180,122,0.12)] transition hover:bg-[#E2C48F] hover:shadow-[0_12px_34px_rgba(214,180,122,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saved ? (
                    <>
                      <Check className="h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {loading ? 'Saving Changes...' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}