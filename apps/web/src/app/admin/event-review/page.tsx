'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { eventService } from '@/services/events';
import {
  Calendar,
  Check,
  Clock3,
  Eye,
  MapPin,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';

type ReviewEvent = Awaited<
  ReturnType<typeof eventService.listAllEventsForAdmin>
>[number];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventReviewPage() {
  const [events, setEvents] = useState<ReviewEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const data = await eventService.listAllEventsForAdmin();
      setEvents(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load the event review queue.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const submitted = useMemo(
    () =>
      events.filter(
        (event) => event.status === 'SUBMITTED_FOR_REVIEW',
      ),
    [events],
  );

  async function handleReview(id: string, approved: boolean) {
    try {
      setProcessingId(id);
      setError(null);

      await eventService.adminReviewEvent(id, approved);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : approved
            ? 'Error approving event.'
            : 'Error rejecting event.',
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <DashboardLayout
      role="admin"
      title="Event Review"
      subtitle="Review organizer submissions before they become publicly discoverable on CtrlPass."
      actions={
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D6B47A]/25 bg-[#D6B47A]/10 px-4 py-2.5 text-xs font-semibold text-[#D6B47A] transition hover:bg-[#D6B47A]/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh Queue
        </button>
      }
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#77736C]">
                  Awaiting Review
                </p>

                <p className="mt-3 text-2xl font-semibold text-[#D6B47A]">
                  {submitted.length}
                </p>

                <p className="mt-1.5 text-xs text-[#77736C]">
                  Event submissions in queue
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6B47A]/20 bg-[#D6B47A]/10 text-[#D6B47A]">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#77736C]">
                  Platform Events
                </p>

                <p className="mt-3 text-2xl font-semibold text-[#F5F5F2]">
                  {events.length}
                </p>

                <p className="mt-1.5 text-xs text-[#77736C]">
                  Events visible to admin
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#A7A39B]">
                <Eye className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#77736C]">
                  Review State
                </p>

                <p className="mt-3 text-2xl font-semibold text-[#7FBF9A]">
                  {submitted.length === 0 ? 'Clear' : 'Active'}
                </p>

                <p className="mt-1.5 text-xs text-[#77736C]">
                  Current moderation status
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#7FBF9A]">
                <Clock3 className="h-4 w-4" />
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-[#D96B6B]/20 bg-[#D96B6B]/5 px-4 py-3 text-xs text-[#D96B6B]">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b]">
          <div className="border-b border-white/[0.06] p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#D6B47A]" />
              <h2 className="text-sm font-semibold text-[#F5F5F2]">
                Submission Queue
              </h2>
            </div>

            <p className="mt-1 text-xs text-[#77736C]">
              Review submitted event details and approve or reject publication.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <ShieldCheck className="mx-auto h-6 w-6 animate-pulse text-[#D6B47A]" />

              <p className="mt-4 text-sm font-medium text-[#F5F5F2]">
                Loading review queue
              </p>

              <p className="mt-1 text-xs text-[#77736C]">
                Fetching submitted events...
              </p>
            </div>
          ) : submitted.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Review Queue Clear"
                description="There are currently no event submissions awaiting platform review."
              />
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {submitted.map((event) => {
                const processing = processingId === event.id;

                return (
                  <article
                    key={event.id}
                    className="p-5 transition hover:bg-white/[0.015] sm:p-6"
                  >
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={event.status} />

                          <span className="rounded-md border border-white/[0.07] bg-[#111111] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-[#A7A39B]">
                            {event.category || 'General'}
                          </span>

                          <span className="text-[10px] uppercase tracking-[0.1em] text-[#77736C]">
                            Submitted {formatDateTime(event.created_at)}
                          </span>
                        </div>

                        <h3 className="mt-4 text-xl font-semibold tracking-tight text-[#F5F5F2]">
                          {event.name}
                        </h3>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#77736C]">
                          {event.description || 'No detailed description submitted.'}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs text-[#A7A39B]">
                          <span className="inline-flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-[#D6B47A]" />
                            {formatDate(event.start_at)}
                          </span>

                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-[#D6B47A]" />
                            {event.venue?.name
                              ? `${event.venue.name}${
                                  event.venue.city
                                    ? `, ${event.venue.city}`
                                    : ''
                                }`
                              : 'Venue TBA'}
                          </span>

                          <span>
                            Organizer:{' '}
                            <span className="text-[#F5F5F2]">
                              {event.organizer?.name || '—'}
                            </span>
                          </span>

                          {event.capacity !== null && (
                            <span>
                              Capacity:{' '}
                              <span className="text-[#F5F5F2]">
                                {event.capacity.toLocaleString('en-IN')}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                        <button
                          type="button"
                          disabled={processing}
                          onClick={() => void handleReview(event.id, true)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D6B47A] px-4 py-2.5 text-xs font-semibold text-[#050505] transition hover:bg-[#E2C58F] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          {processing ? 'Processing...' : 'Approve & Publish'}
                        </button>

                        <button
                          type="button"
                          disabled={processing}
                          onClick={() => void handleReview(event.id, false)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D96B6B]/25 bg-[#D96B6B]/5 px-4 py-2.5 text-xs font-semibold text-[#D96B6B] transition hover:bg-[#D96B6B]/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          Reject Submission
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}