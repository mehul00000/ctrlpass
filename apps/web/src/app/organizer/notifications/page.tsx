'use client';

import { FormEvent, useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import { Bell, Send, CheckCircle2, AlertCircle, Megaphone } from 'lucide-react';
import { eventService } from '@/services/events';
import { organizerService } from '@/services/organizer';
import { Event } from '@ctrlpass/types';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function NotificationsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        setError(null);

        const data = await eventService.listOrganizerEvents();

        setEvents(data);

        if (data[0]) {
          setEventId(data[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load events.'
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const selectedEvent = events.find((event) => event.id === eventId);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setSentCount(null);

    if (!eventId || !title.trim() || !message.trim()) {
      setError('Select an event and complete both message fields.');
      return;
    }

    setSending(true);

    try {
      const result = await organizerService.dispatchAnnouncement(
        eventId,
        title.trim(),
        message.trim()
      );

      setSentCount(result.recipientCount);
      setTitle('');
      setMessage('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not send announcement.'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout
      role="organizer"
      title="Notifications"
      subtitle="Broadcast important event updates to confirmed ticket holders."
    >
      <div className="space-y-8">
        {/* Page intro */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-[#080808] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D6B47A]/15 bg-[#D6B47A]/[0.06] text-[#D6B47A]">
              <Megaphone className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[#F5F5F2]">
                Event Broadcast
              </h2>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-[#77736C]">
                Send operational updates, gate instructions, schedule
                changes, or important announcements directly to confirmed
                attendees.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-[#7FBF9A]/15 bg-[#7FBF9A]/[0.05] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7FBF9A]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#7FBF9A]">
              Delivery Ready
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Composer */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-6 sm:p-8">
            <div className="mb-7">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#D6B47A]">
                  <Send className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#F5F5F2]">
                    Compose Announcement
                  </h3>

                  <p className="mt-1 text-xs text-[#77736C]">
                    Target one event at a time.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#D96B6B]/20 bg-[#D96B6B]/[0.06] p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D96B6B]" />

                <p className="text-xs leading-5 text-[#D96B6B]">
                  {error}
                </p>
              </div>
            )}

            {sentCount !== null && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#7FBF9A]/20 bg-[#7FBF9A]/[0.06] p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#7FBF9A]" />

                <div>
                  <p className="text-xs font-semibold text-[#7FBF9A]">
                    Announcement dispatched
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#7FBF9A]/70">
                    Saved for {sentCount.toLocaleString('en-IN')}{' '}
                    confirmed attendee
                    {sentCount === 1 ? '' : 's'}.
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex items-center gap-3 text-xs text-[#77736C]">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#D6B47A]/20 border-t-[#D6B47A]" />
                  Loading your events...
                </div>
              </div>
            ) : events.length === 0 ? (
              <EmptyState
                title="No events available"
                description="Create an event before sending attendee announcements."
                actionText="Create Event"
                actionHref="/organizer/events/new"
              />
            ) : (
              <form onSubmit={handleSend} className="space-y-6">
                {/* Event */}
                <div>
                  <label
                    htmlFor="event"
                    className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]"
                  >
                    Event
                  </label>

                  <select
                    id="event"
                    required
                    value={eventId}
                    onChange={(event) => {
                      setEventId(event.target.value);
                      setSentCount(null);
                    }}
                    className="w-full appearance-none rounded-xl border border-white/[0.08] bg-[#050505] px-4 py-3 text-sm text-[#F5F5F2] outline-none transition focus:border-[#D6B47A]/50"
                  >
                    {events.map((event) => (
                      <option
                        key={event.id}
                        value={event.id}
                        className="bg-[#080808]"
                      >
                        {event.name}
                      </option>
                    ))}
                  </select>

                  {selectedEvent && (
                    <p className="mt-2 text-[11px] text-[#55524D]">
                      This announcement will target confirmed ticket
                      holders for this event.
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label
                    htmlFor="announcement-title"
                    className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]"
                  >
                    Announcement Headline
                  </label>

                  <input
                    id="announcement-title"
                    type="text"
                    required
                    maxLength={120}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Entry gates open at 6:30 PM"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#050505] px-4 py-3 text-sm text-[#F5F5F2] placeholder:text-[#55524D] outline-none transition focus:border-[#D6B47A]/50"
                  />

                  <div className="mt-2 flex justify-end">
                    <span className="text-[10px] text-[#55524D]">
                      {title.length}/120
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="announcement-message"
                    className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]"
                  >
                    Message
                  </label>

                  <textarea
                    id="announcement-message"
                    rows={6}
                    required
                    maxLength={1000}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Write the information attendees need to know..."
                    className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#050505] px-4 py-3 text-sm leading-6 text-[#F5F5F2] placeholder:text-[#55524D] outline-none transition focus:border-[#D6B47A]/50"
                  />

                  <div className="mt-2 flex justify-end">
                    <span className="text-[10px] text-[#55524D]">
                      {message.length}/1000
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-md text-[11px] leading-5 text-[#55524D]">
                    Only confirmed booking holders for the selected event
                    are targeted by the announcement service.
                  </p>

                  <button
                    type="submit"
                    disabled={
                      sending ||
                      !eventId ||
                      !title.trim() ||
                      !message.trim()
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D6B47A] px-5 py-3 text-xs font-semibold text-[#050505] transition hover:bg-[#E1C58F] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#050505]/20 border-t-[#050505]" />
                        Dispatching...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Dispatch Announcement
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Delivery information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#D6B47A]">
                <Bell className="h-4 w-4" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#F5F5F2]">
                  Delivery
                </h3>

                <p className="text-[11px] text-[#55524D]">
                  Notification workflow
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-5">
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#77736C]">
                    Audience
                  </p>

                  <p className="mt-2 text-sm font-medium text-[#F5F5F2]">
                    Confirmed ticket holders
                  </p>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#77736C]">
                    Delivery
                  </p>

                  <p className="mt-2 text-sm font-medium text-[#F5F5F2]">
                    Mobile Notifications
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#77736C]">
                    Attendees can see announcements from the mobile
                    Notifications tab after signing in.
                  </p>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#77736C]">
                    Best used for
                  </p>

                  <ul className="mt-3 space-y-2 text-xs text-[#A7A39B]">
                    <li>• Gate and entry instructions</li>
                    <li>• Schedule changes</li>
                    <li>• Venue information</li>
                    <li>• Important event updates</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#D6B47A]/10 bg-[#D6B47A]/[0.035] p-5">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D6B47A]" />

                <p className="text-xs leading-5 text-[#77736C]">
                  Keep announcements concise and operational. The
                  notification is stored through the existing organizer
                  announcement service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}