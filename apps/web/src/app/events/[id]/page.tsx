'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { brandAssets } from '@/lib/brand';
import { eventService } from '@/services/events';
import { bookingService } from '@/services/bookings';
import { startCashfreeCheckout } from '@/lib/cashfreeCheckout';
import { userFacingError } from '@/lib/userFacingError';
import {
  Event,
  TicketType,
  remainingInventory,
  bookingFeeMinor,
} from '@ctrlpass/types';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Share2,
  Ticket,
  Timer,
  Users,
  X,
} from 'lucide-react';

interface BookingResult {
  booking_id: string;
  reference: string;
  total_minor: number;
  status: 'CONFIRMED' | 'PENDING';
}

export default function EventBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [payStage, setPayStage] = useState<
    'reserving' | 'opening' | 'verifying'
  >('reserving');

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] =
    useState<BookingResult | null>(null);

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);

        const data = await eventService.getById(id);

        if (!data) {
          setError('Event not found or has concluded.');
          return;
        }

        setEvent(data);

        const activeTiers = (data.ticket_types || []).filter(
          (ticket) => ticket.status === 'ACTIVE',
        );

        if (activeTiers.length > 0) {
          const availableTier = activeTiers.find(
            (ticket) => remainingInventory(ticket) > 0,
          );

          setSelectedTierId(
            availableTier?.id || activeTiers[0].id,
          );
        }
      } catch (err: unknown) {
        setError(userFacingError(err, 'Failed to load event details.'));
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [id]);

  const activeTiers =
    (event?.ticket_types || []).filter(
      (ticket) => ticket.status === 'ACTIVE',
    );

  const selectedTier = activeTiers.find(
    (ticket) => ticket.id === selectedTierId,
  );

  const selectedRemaining = selectedTier
    ? remainingInventory(selectedTier)
    : 0;

  const maxPerBooking = selectedTier?.max_per_booking || 10;

  const isFree = (selectedTier?.price_minor || 0) === 0;

  const subtotalMinor =
    (selectedTier?.price_minor || 0) * quantity;

  const bookingFeeMinorValue = bookingFeeMinor(
    quantity,
    !isFree,
  );

  const taxMinor = 0;

  const totalMinor =
    subtotalMinor + bookingFeeMinorValue + taxMinor;

  const handleQuantityChange = (nextQuantity: number) => {
    if (!selectedTier) return;

    const next = Math.max(
      1,
      Math.min(
        nextQuantity,
        maxPerBooking,
        selectedRemaining,
      ),
    );

    setQuantity(next);
  };

  const handleSelectTier = (tier: TicketType) => {
    if (remainingInventory(tier) <= 0) return;

    setSelectedTierId(tier.id);
    setQuantity(1);
    setCheckoutError(null);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event?.name || 'CtrlPass Event',
          text: event?.short_description || event?.name || '',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // User cancelled native share.
    }
  };

  const handleBook = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!event || !selectedTier) return;

    if (!attendeeName.trim() || !attendeeEmail.trim()) {
      setCheckoutError(
        'Please provide attendee name and contact email.',
      );
      return;
    }

    if (quantity < 1 || quantity > maxPerBooking) {
      setCheckoutError(
        `You can book up to ${maxPerBooking} tickets for this tier.`,
      );
      return;
    }

    if (quantity > selectedRemaining) {
      setCheckoutError(
        'The selected quantity is no longer available.',
      );
      return;
    }

    setSubmitting(true);
    setPayStage('reserving');
    setCheckoutError(null);

    try {
      const reservation =
        await bookingService.createReservation({
          event_id: event.id,
          items: [
            {
              ticket_type_id: selectedTier.id,
              quantity,
            },
          ],
          attendee: {
            name: attendeeName.trim(),
            email: attendeeEmail.trim(),
            phone: attendeePhone.trim()
              ? `+91${attendeePhone
                  .replace(/\D/g, '')
                  .slice(-10)}`
              : undefined,
          },
        });

      if (reservation.total_minor === 0) {
        const confirmed =
          await bookingService.confirmFree(
            reservation.booking_id,
          );

        if (confirmed.status !== 'CONFIRMED') {
          throw new Error(
            'Free registration did not complete. Try again or contact support.',
          );
        }

        setBookingSuccess({
          booking_id: reservation.booking_id,
          reference: reservation.booking_reference,
          total_minor: 0,
          status: 'CONFIRMED',
        });

        return;
      }

      setPayStage('opening');

      const payment =
        await bookingService.initiatePayment(
          reservation.booking_id,
        );

      await startCashfreeCheckout(
        payment.checkout_data.payment_session_id,
      );

      setPayStage('verifying');

      const settled =
        await bookingService.waitForConfirmation(
          reservation.booking_id,
        );

      if (settled.status !== 'CONFIRMED') {
        throw new Error(
          settled.status === 'PAYMENT_PENDING' ||
            settled.status === 'RESERVED'
            ? 'Payment is still processing. Your pass will appear in the CtrlPass app after the bank confirms it.'
            : 'Payment was not confirmed. No pass has been issued.',
        );
      }

      setBookingSuccess({
        booking_id: settled.id,
        reference: settled.booking_reference,
        total_minor: settled.total_amount_minor,
        status: 'CONFIRMED',
      });
    } catch (err: unknown) {
      setCheckoutError(
        userFacingError(
          err,
          'Unable to complete ticket reservation.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Date TBA';

    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
      return 'Date TBA';
    }

    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';

    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const formatPrice = (minor: number) => {
    if (minor === 0) return 'FREE';

    return `₹${(minor / 100).toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#F5F5F2]">
        <Navbar />

        <main className="min-h-[75vh] flex items-center justify-center px-6">
          <div className="flex flex-col items-center gap-5">
            <div className="w-12 h-12 rounded-full border border-[#D6B47A]/30 border-t-[#D6B47A] animate-spin" />

            <div className="text-center">
              <p className="text-sm font-medium">
                Loading event
              </p>
              <p className="text-xs text-[#77736C] mt-1">
                Preparing your booking experience
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#F5F5F2]">
        <Navbar />

        <main className="min-h-[75vh] flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 w-14 h-14 rounded-full border border-[#D96B6B]/30 bg-[#D96B6B]/10 flex items-center justify-center">
              <X className="w-6 h-6 text-[#D96B6B]" />
            </div>

            <p className="text-[11px] uppercase tracking-[0.22em] text-[#77736C]">
              Event unavailable
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              We couldn't open this event
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#A7A39B]">
              {error || 'This event could not be found.'}
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#D6B47A] px-5 py-3 text-sm font-semibold text-[#050505] hover:bg-[#E1C48E] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to events
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#F5F5F2]">
        <Navbar />

        <main className="min-h-[75vh] flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-2xl">
            <div className="relative overflow-hidden rounded-[32px] border border-[#D6B47A]/25 bg-[#0B0B0B]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D6B47A] to-transparent" />

              <div className="p-7 sm:p-10 md:p-14 text-center">
                <div className="mx-auto w-16 h-16 rounded-full border border-[#7FBF9A]/30 bg-[#7FBF9A]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[#7FBF9A]" />
                </div>

                <p className="mt-7 text-[11px] uppercase tracking-[0.24em] text-[#7FBF9A]">
                  Booking confirmed
                </p>

                <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
                  You're going to {event.name}
                </h1>

                <p className="mt-4 text-sm leading-6 text-[#A7A39B] max-w-lg mx-auto">
                  Your booking has been confirmed. Your live
                  ticket and QR credential will be available
                  through CtrlPass.
                </p>

                <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 text-left">
                  <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.06]">
                    <span className="text-xs text-[#77736C]">
                      Booking reference
                    </span>

                    <span className="font-mono text-sm font-semibold text-[#F5F5F2]">
                      {bookingSuccess.reference}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.06]">
                    <span className="text-xs text-[#77736C]">
                      Attendee
                    </span>

                    <span className="text-sm font-medium">
                      {attendeeName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-3">
                    <span className="text-xs text-[#77736C]">
                      Amount paid
                    </span>

                    <span className="font-mono text-sm font-semibold text-[#D6B47A]">
                      {bookingSuccess.total_minor === 0
                        ? 'FREE'
                        : formatPrice(
                            bookingSuccess.total_minor,
                          )}
                    </span>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D6B47A] px-5 py-3.5 text-sm font-semibold text-[#050505] hover:bg-[#E1C48E] transition-colors"
                  >
                    Explore more events
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="inline-flex items-center justify-center rounded-xl border border-white/[0.1] px-5 py-3.5 text-sm font-medium text-[#F5F5F2] hover:bg-white/[0.04] transition-colors"
                  >
                    Return home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F2]">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="h-[46vh] min-h-[360px] md:h-[64vh] md:min-h-[520px] relative overflow-hidden">
            <img
              src={
                event.cover_image_url ||
                brandAssets.eventPlaceholder
              }
              alt={event.name}
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/35 to-black/10" />
            <div className="absolute inset-0 bg-black/15" />

            <div className="absolute top-6 left-4 sm:left-8 lg:left-12">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 backdrop-blur-md px-4 py-2 text-xs font-medium text-white hover:bg-black/50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Discover events
              </Link>
            </div>

            <div className="absolute top-6 right-4 sm:right-8 lg:right-12">
              <button
                type="button"
                onClick={handleShare}
                className="w-10 h-10 rounded-full border border-white/15 bg-black/35 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                aria-label="Share event"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <div className="absolute left-4 right-4 sm:left-8 sm:right-8 lg:left-12 lg:right-12 bottom-8 md:bottom-12">
              <div className="max-w-6xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D6B47A]/35 bg-black/45 backdrop-blur-md px-3.5 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D6B47A]" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#E7C994]">
                    {event.category || 'Live event'}
                  </span>
                </div>

                <h1 className="mt-4 max-w-4xl text-4xl sm:text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[0.95]">
                  {event.name}
                </h1>

                {event.short_description && (
                  <p className="mt-5 max-w-2xl text-sm sm:text-base text-white/70 leading-6">
                    {event.short_description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-start">
            {/* Event information */}
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/[0.08] bg-[#0B0B0B] p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D6B47A]/10 border border-[#D6B47A]/20 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-[#D6B47A]" />
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#77736C]">
                        Date
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatDate(event.start_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#0B0B0B] p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D6B47A]/10 border border-[#D6B47A]/20 flex items-center justify-center">
                      <Clock3 className="w-4 h-4 text-[#D6B47A]" />
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#77736C]">
                        Time
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatTime(event.start_at)} IST
                      </p>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 rounded-2xl border border-white/[0.08] bg-[#0B0B0B] p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D6B47A]/10 border border-[#D6B47A]/20 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-[#D6B47A]" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#77736C]">
                        Venue
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {event.venue?.name ||
                          'Venue to be announced'}
                      </p>

                      <p className="mt-1 text-xs text-[#77736C]">
                        {event.venue?.address_line
                          ? `${event.venue.address_line}, `
                          : ''}
                        {event.venue?.city || 'India'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <article className="rounded-3xl border border-white/[0.08] bg-[#0B0B0B] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-5 rounded-full bg-[#D6B47A]" />
                  <h2 className="text-lg font-semibold">
                    About the experience
                  </h2>
                </div>

                <div className="text-sm leading-7 text-[#A7A39B] whitespace-pre-line">
                  {event.description ||
                    'Join us for this curated experience. Your CtrlPass ticket provides verified entry and a seamless check-in experience.'}
                </div>
              </article>

              <div className="rounded-3xl border border-white/[0.08] bg-[#0B0B0B] p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#D6B47A]/10 border border-[#D6B47A]/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#D6B47A]" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">
                      Secure digital entry
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-[#77736C]">
                      Your ticket is issued through CtrlPass with
                      a unique digital credential. Entry is
                      verified at the venue using the
                      server-authoritative check-in system.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking card */}
            <aside className="lg:sticky lg:top-24">
              <div className="rounded-[28px] border border-[#D6B47A]/20 bg-[#0B0B0B] overflow-hidden shadow-2xl">
                <div className="h-1 bg-gradient-to-r from-transparent via-[#D6B47A] to-transparent" />

                <div className="p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#77736C]">
                        Tickets
                      </p>

                      <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                        Book your pass
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#7FBF9A]">
                      <Timer className="w-3.5 h-3.5" />
                      10 min hold
                    </div>
                  </div>

                  {checkoutError && (
                    <div className="mt-5 rounded-xl border border-[#D96B6B]/25 bg-[#D96B6B]/10 p-3.5 text-xs text-[#E99A9A]">
                      {checkoutError}
                    </div>
                  )}

                  <form
                    onSubmit={handleBook}
                    className="mt-6 space-y-6"
                  >
                    {/* Ticket tiers */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] uppercase tracking-[0.18em] text-[#77736C]">
                          Select ticket
                        </label>

                        <span className="text-[10px] text-[#77736C]">
                          {activeTiers.length} tier
                          {activeTiers.length !== 1
                            ? 's'
                            : ''}
                        </span>
                      </div>

                      {activeTiers.length === 0 ? (
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs text-[#77736C]">
                          No active ticket tiers are currently
                          available.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeTiers.map((tier) => {
                            const remaining =
                              remainingInventory(tier);

                            const soldOut = remaining <= 0;
                            const selected =
                              tier.id === selectedTierId;

                            return (
                              <button
                                key={tier.id}
                                type="button"
                                disabled={soldOut}
                                onClick={() =>
                                  handleSelectTier(tier)
                                }
                                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                                  soldOut
                                    ? 'border-white/[0.05] bg-white/[0.015] opacity-45 cursor-not-allowed'
                                    : selected
                                      ? 'border-[#D6B47A]/60 bg-[#D6B47A]/[0.08]'
                                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.18]'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                          selected
                                            ? 'border-[#D6B47A]'
                                            : 'border-[#77736C]'
                                        }`}
                                      >
                                        {selected && (
                                          <span className="w-2 h-2 rounded-full bg-[#D6B47A]" />
                                        )}
                                      </span>

                                      <span className="text-sm font-medium truncate">
                                        {tier.name}
                                      </span>
                                    </div>

                                    <p className="mt-2 ml-6 text-[10px] text-[#77736C]">
                                      {soldOut
                                        ? 'Sold out'
                                        : `${remaining} remaining · Max ${
                                            tier.max_per_booking ||
                                            10
                                          } per booking`}
                                    </p>
                                  </div>

                                  <span className="font-mono text-sm font-semibold text-[#D6B47A] shrink-0">
                                    {formatPrice(
                                      tier.price_minor,
                                    )}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    {selectedTier && (
                      <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                        <div>
                          <p className="text-xs font-medium">
                            Quantity
                          </p>

                          <p className="text-[10px] text-[#77736C] mt-1">
                            Up to {maxPerBooking} per booking
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={quantity <= 1}
                            onClick={() =>
                              handleQuantityChange(
                                quantity - 1,
                              )
                            }
                            className="w-8 h-8 rounded-lg border border-white/[0.1] flex items-center justify-center hover:bg-white/[0.05] disabled:opacity-30 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-5 text-center font-mono text-sm font-semibold">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            disabled={
                              quantity >=
                              Math.min(
                                maxPerBooking,
                                selectedRemaining,
                              )
                            }
                            onClick={() =>
                              handleQuantityChange(
                                quantity + 1,
                              )
                            }
                            className="w-8 h-8 rounded-lg border border-white/[0.1] flex items-center justify-center hover:bg-white/[0.05] disabled:opacity-30 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Attendee */}
                    <div className="border-t border-white/[0.07] pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-3.5 h-3.5 text-[#D6B47A]" />
                        <span className="text-[10px] uppercase tracking-[0.18em] text-[#77736C]">
                          Attendee details
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <input
                          type="text"
                          required
                          value={attendeeName}
                          onChange={(e) =>
                            setAttendeeName(e.target.value)
                          }
                          placeholder="Full name"
                          className="w-full rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 py-3 text-sm text-[#F5F5F2] placeholder:text-[#55524D] outline-none focus:border-[#D6B47A]/50 transition-colors"
                        />

                        <input
                          type="email"
                          required
                          value={attendeeEmail}
                          onChange={(e) =>
                            setAttendeeEmail(e.target.value)
                          }
                          placeholder="Email address"
                          className="w-full rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 py-3 text-sm text-[#F5F5F2] placeholder:text-[#55524D] outline-none focus:border-[#D6B47A]/50 transition-colors"
                        />

                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-[#77736C]">
                            +91
                          </span>

                          <input
                            type="tel"
                            maxLength={10}
                            value={attendeePhone}
                            onChange={(e) =>
                              setAttendeePhone(
                                e.target.value.replace(
                                  /\D/g,
                                  '',
                                ),
                              )
                            }
                            placeholder="Mobile number"
                            className="w-full rounded-xl border border-white/[0.09] bg-white/[0.025] pl-12 pr-4 py-3 text-sm text-[#F5F5F2] placeholder:text-[#55524D] outline-none focus:border-[#D6B47A]/50 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="border-t border-white/[0.07] pt-5 space-y-2.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#77736C]">
                          Pass subtotal
                        </span>

                        <span className="font-mono">
                          {isFree
                            ? 'FREE'
                            : formatPrice(
                                subtotalMinor,
                              )}
                        </span>
                      </div>

                      {!isFree && (
                        <div className="flex justify-between text-xs">
                          <span className="text-[#77736C]">
                            Booking fee
                          </span>

                          <span className="font-mono">
                            {formatPrice(
                              bookingFeeMinorValue,
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-end border-t border-white/[0.07] pt-4">
                        <span className="text-sm font-semibold">
                          Total
                        </span>

                        <span className="font-mono text-xl font-semibold text-[#D6B47A]">
                          {isFree
                            ? 'FREE'
                            : formatPrice(totalMinor)}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        !selectedTier ||
                        selectedRemaining <= 0
                      }
                      className="w-full rounded-xl bg-[#D6B47A] px-5 py-3.5 text-sm font-semibold text-[#050505] flex items-center justify-center gap-2 hover:bg-[#E1C48E] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />

                          {payStage === 'reserving'
                            ? 'Holding reservation...'
                            : payStage === 'opening'
                              ? 'Opening payment...'
                              : 'Verifying payment...'}
                        </>
                      ) : (
                        <>
                          <Ticket className="w-4 h-4" />

                          {isFree
                            ? 'Confirm free pass'
                            : `Pay ${formatPrice(
                                totalMinor,
                              )}`}
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-[#55524D]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Secure checkout powered by Cashfree
                    </div>
                  </form>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}