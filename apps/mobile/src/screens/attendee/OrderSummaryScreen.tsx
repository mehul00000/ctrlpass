import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { toast } from '../../components/toast';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingSkeleton, ErrorState } from '../../components';
import { PrimaryButton } from '../../components/cinema';
import { bookingService } from '../../services/bookings';
import { eventService } from '../../services/events';
import { startCashfreeCheckout } from '../../lib/cashfreeCheckout';
import {
  Event,
  TicketType,
  ReservationResponse,
} from '../../types';
import { AttendeeStackParamList } from '../../navigation/types';
import {
  colors,
  spacing,
  typography,
} from '../../theme';
import {
  formatDateTime,
  formatPaiseCompact,
} from '../../lib/utils';

type Props = NativeStackScreenProps<
  AttendeeStackParamList,
  'OrderSummary'
>;

export default function OrderSummaryScreen({
  route,
  navigation,
}: Props) {
  const {
    eventId,
    ticketTypeId,
    quantity,
    attendeeName,
    attendeeEmail,
    attendeePhone,
    extraFields,
  } = route.params;

  const insets = useSafeAreaInsets();

  const [event, setEvent] =
    useState<Event | null>(null);

  const [ticketType, setTicketType] =
    useState<TicketType | null>(null);

  const [reservation, setReservation] =
    useState<ReservationResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [timeLeft, setTimeLeft] =
    useState(600);

  /* ---------------------------------------------------------------
     CREATE SERVER-AUTHORITATIVE RESERVATION
  --------------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        setLoading(true);
        setError(null);

        const [eventData, types] =
          await Promise.all([
            eventService.getEvent(eventId),
            eventService.getTicketTypes(eventId),
          ]);

        if (!eventData) {
          throw new Error('Event not found');
        }

        if (!mounted) return;

        setEvent(eventData);

        const selectedTicket = types.find(
          ticket => ticket.id === ticketTypeId,
        );

        if (!selectedTicket) {
          throw new Error(
            'Ticket tier not found',
          );
        }

        setTicketType(selectedTicket);

        /*
         * IMPORTANT:
         * The reservation is created server-side.
         * The client never assumes that 10 minutes
         * is available. The returned expires_at is
         * the source of truth.
         */
        const res =
          await bookingService.createReservation({
            event_id: eventId,
            items: [
              {
                ticket_type_id: ticketTypeId,
                quantity,
              },
            ],
            attendee: {
              name: attendeeName,
              email: attendeeEmail,
              phone: attendeePhone,
              extra_fields: extraFields,
            },
          });

        if (!mounted) return;

        setReservation(res);

        const serverSeconds = Math.floor(
          (new Date(res.expires_at).getTime() -
            Date.now()) /
            1000,
        );

        setTimeLeft(
          Math.max(0, serverSeconds),
        );
      } catch (err) {
        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Reservation failed',
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [
    eventId,
    ticketTypeId,
    quantity,
    attendeeName,
    attendeeEmail,
    attendeePhone,
    extraFields,
  ]);

  /* ---------------------------------------------------------------
     SERVER EXPIRY COUNTDOWN
  --------------------------------------------------------------- */

  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(previous => {
        if (previous <= 1) {
          clearInterval(timer);

          Alert.alert(
            'Hold Expired',
            'Your ticket reservation hold has expired. Please select your tickets again.',
            [
              {
                text: 'OK',
                onPress: () =>
                  navigation.popToTop(),
              },
            ],
          );

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigation]);

  /* ---------------------------------------------------------------
     DERIVED VALUES
  --------------------------------------------------------------- */

  const isFree =
    reservation?.total_minor === 0;

  const timerUrgent = timeLeft <= 120;

  const timerMinutes =
    Math.floor(timeLeft / 60);

  const timerSeconds =
    timeLeft % 60;

  const formattedTimer = `${timerMinutes}:${
    timerSeconds < 10 ? '0' : ''
  }${timerSeconds}`;

  const attendeeInitial =
    attendeeName.trim().charAt(0).toUpperCase() ||
    'A';

  const paymentLabel = useMemo(() => {
    if (!reservation) {
      return '';
    }

    return isFree
      ? 'Confirm Free Registration'
      : `Pay ${formatPaiseCompact(
          reservation.total_minor,
        )}`;
  }, [reservation, isFree]);

  /* ---------------------------------------------------------------
     COMPLETE ORDER
  --------------------------------------------------------------- */

  const handleCompleteOrder = async () => {
    if (!reservation || timeLeft <= 0) {
      Alert.alert(
        'Hold Expired',
        'Your ticket reservation has expired. Please select your tickets again.',
      );

      return;
    }

    setSubmitting(true);

    try {
      if (reservation.total_minor === 0) {
        await bookingService.confirmFree(
          reservation.booking_id,
        );
      } else {
        /*
         * Payment remains server-authoritative.
         * Cashfree checkout receives the server-created
         * payment session, not a client-calculated amount.
         */
        const payment =
          await bookingService.initiatePayment(
            reservation.booking_id,
          );

        await startCashfreeCheckout(
          payment.checkout_data
            .payment_session_id,
          payment.order_id,
        );
      }

      navigation.replace('BookingStatus', {
        bookingId: reservation.booking_id,
      });
    } catch (err) {
      toast.error('Payment error', {
        description: err instanceof Error
          ? err.message
          : 'Transaction could not be completed.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------
     LOADING / ERROR
  --------------------------------------------------------------- */

  if (loading) {
    return (
      <LoadingSkeleton label="Order Summary" />
    );
  }

  if (
    error ||
    !event ||
    !ticketType ||
    !reservation
  ) {
    return (
      <ErrorState
        message={
          error ??
          'Order initialization error'
        }
        onBack={() => navigation.goBack()}
      />
    );
  }

  /* ---------------------------------------------------------------
     UI
  --------------------------------------------------------------- */

  return (
    <View style={s.container}>
      <SafeAreaView
        edges={['top']}
        style={s.safeArea}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.content,
            {
              paddingBottom:
                150 + insets.bottom,
            },
          ]}
          bounces
          overScrollMode="never"
        >
          {/* -------------------------------------------------------
              HEADER
          ------------------------------------------------------- */}

          <View style={s.header}>
            <View style={s.stepRow}>
              <View style={s.stepCircle}>
                <Text style={s.stepNumber}>
                  3
                </Text>
              </View>

              <Text style={s.stepLabel}>
                REVIEW & PAYMENT
              </Text>
            </View>

            <Text style={s.title}>
              Your night starts here.
            </Text>

            <Text style={s.subtitle}>
              Check everything once before you
              secure your passes.
            </Text>
          </View>

          {/* -------------------------------------------------------
              HOLD TIMER
          ------------------------------------------------------- */}

          <View
            style={[
              s.holdCard,
              timerUrgent &&
                s.holdCardUrgent,
            ]}
          >
            <View style={s.holdLeft}>
              <View
                style={[
                  s.clockCircle,
                  timerUrgent &&
                    s.clockCircleUrgent,
                ]}
              >
                <View
                  style={[
                    s.clockHand,
                    timerUrgent &&
                      s.clockHandUrgent,
                  ]}
                />
              </View>

              <View>
                <Text style={s.holdEyebrow}>
                  PASSES RESERVED
                </Text>

                <Text
                  style={[
                    s.holdTitle,
                    timerUrgent &&
                      s.holdTitleUrgent,
                  ]}
                >
                  Held for you
                </Text>
              </View>
            </View>

            <View style={s.timerBlock}>
              <Text
                style={[
                  s.timerValue,
                  timerUrgent &&
                    s.timerValueUrgent,
                ]}
              >
                {formattedTimer}
              </Text>

              <Text style={s.timerCaption}>
                remaining
              </Text>
            </View>
          </View>

          {/* -------------------------------------------------------
              EVENT
          ------------------------------------------------------- */}

          <View style={s.section}>
            <Text style={s.sectionEyebrow}>
              YOUR EVENT
            </Text>

            <View style={s.eventCard}>
              <View style={s.eventAccent} />

              <View style={s.eventCopy}>
                <Text
                  style={s.eventName}
                  numberOfLines={3}
                >
                  {event.name}
                </Text>

                <View style={s.eventInfo}>
                  <Text style={s.eventInfoText}>
                    {formatDateTime(
                      event.start_at,
                    )}
                  </Text>

                  {event.venue?.name ? (
                    <>
                      <View
                        style={s.infoDot}
                      />

                      <Text
                        style={s.eventInfoText}
                        numberOfLines={1}
                      >
                        {event.venue.name}
                        {event.venue.city
                          ? ` · ${event.venue.city}`
                          : ''}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          {/* -------------------------------------------------------
              PASS
          ------------------------------------------------------- */}

          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionEyebrow}>
                PASSES
              </Text>

              <Text style={s.quantityLabel}>
                {quantity}{' '}
                {quantity === 1
                  ? 'pass'
                  : 'passes'}
              </Text>
            </View>

            <View style={s.passCard}>
              <View style={s.passIcon}>
                <View style={s.passIconInner} />
              </View>

              <View style={s.passCopy}>
                <Text style={s.passName}>
                  {ticketType.name}
                </Text>

                <Text style={s.passDescription}>
                  {quantity} ×{' '}
                  {ticketType.price_minor === 0
                    ? 'Free'
                    : formatPaiseCompact(
                        ticketType.price_minor,
                      )}
                </Text>
              </View>

              <Text style={s.passAmount}>
                {formatPaiseCompact(
                  reservation.subtotal_minor,
                )}
              </Text>
            </View>
          </View>

          {/* -------------------------------------------------------
              ATTENDEE
          ------------------------------------------------------- */}

          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionEyebrow}>
                ATTENDEE
              </Text>

              <Text style={s.editHint}>
                BOOKING DETAILS
              </Text>
            </View>

            <View style={s.attendeeCard}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>
                  {attendeeInitial}
                </Text>
              </View>

              <View style={s.attendeeCopy}>
                <Text style={s.attendeeName}>
                  {attendeeName}
                </Text>

                <Text
                  style={s.attendeeDetail}
                  numberOfLines={1}
                >
                  {attendeeEmail}
                </Text>

                <Text style={s.attendeeDetail}>
                  {attendeePhone}
                </Text>
              </View>
            </View>
          </View>

          {/* -------------------------------------------------------
              PAYMENT BREAKDOWN
          ------------------------------------------------------- */}

          <View style={s.section}>
            <Text style={s.sectionEyebrow}>
              PAYMENT
            </Text>

            <View style={s.paymentCard}>
              <PriceRow
                label="Ticket subtotal"
                value={formatPaiseCompact(
                  reservation.subtotal_minor,
                )}
              />

              {!isFree ? (
                <>
                  <PriceRow
                    label="Booking fee"
                    value={formatPaiseCompact(
                      reservation.booking_fee_minor,
                    )}
                  />

                  {reservation.tax_minor > 0 ? (
                    <PriceRow
                      label="GST on booking fee"
                      value={formatPaiseCompact(
                        reservation.tax_minor,
                      )}
                    />
                  ) : null}
                </>
              ) : (
                <View style={s.priceRow}>
                  <Text style={s.priceLabel}>
                    Booking fee
                  </Text>

                  <Text
                    style={[
                      s.priceValue,
                      s.waived,
                    ]}
                  >
                    WAIVED
                  </Text>
                </View>
              )}

              <View style={s.paymentDivider} />

              <View style={s.totalRow}>
                <View>
                  <Text style={s.totalLabel}>
                    TOTAL
                  </Text>

                  <Text style={s.totalSub}>
                    {isFree
                      ? 'No payment required'
                      : 'Final amount payable'}
                  </Text>
                </View>

                <Text style={s.totalValue}>
                  {isFree
                    ? 'FREE'
                    : formatPaiseCompact(
                        reservation.total_minor,
                      )}
                </Text>
              </View>
            </View>
          </View>

          {/* -------------------------------------------------------
              PAYMENT TRUST
          ------------------------------------------------------- */}

          {!isFree ? (
            <View style={s.paymentTrust}>
              <View style={s.lockIcon}>
                <View style={s.lockBody} />
                <View style={s.lockTop} />
              </View>

              <View style={s.trustCopy}>
                <Text style={s.trustTitle}>
                  Secure payment
                </Text>

                <Text style={s.trustText}>
                  You'll complete payment securely
                  through Cashfree.
                </Text>
              </View>

              <Text style={s.cashfree}>
                CASHFREE
              </Text>
            </View>
          ) : null}

          {/* -------------------------------------------------------
              FOOTER
          ------------------------------------------------------- */}

          <View style={s.footer}>
            <View style={s.footerLine} />

            <Text style={s.footerText}>
              CTRL PASS
            </Text>

            <View style={s.footerLine} />
          </View>
        </ScrollView>

        {/* ---------------------------------------------------------
            STICKY CTA
        --------------------------------------------------------- */}

        <View
          style={[
            s.bottomBar,
            {
              paddingBottom:
                Math.max(
                  insets.bottom + 8,
                  18,
                ),
            },
          ]}
        >
          <View style={s.bottomTotal}>
            <Text style={s.bottomLabel}>
              TOTAL
            </Text>

            <Text style={s.bottomValue}>
              {isFree
                ? 'FREE'
                : formatPaiseCompact(
                    reservation.total_minor,
                  )}
            </Text>
          </View>

          <PrimaryButton
            title={paymentLabel}
            loading={submitting}
            disabled={
              submitting ||
              timeLeft <= 0
            }
            onPress={
              handleCompleteOrder
            }
            style={s.payButton}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

/* =================================================================
   PRICE ROW
================================================================= */

function PriceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={s.priceRow}>
      <Text style={s.priceLabel}>
        {label}
      </Text>

      <Text style={s.priceValue}>
        {value}
      </Text>
    </View>
  );
}

/* =================================================================
   STYLES
================================================================= */

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },

  safeArea: {
    flex: 1,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  /* ---------------------------------------------------------------
     HEADER
  --------------------------------------------------------------- */

  header: {
    paddingBottom: 24,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 17,
  },

  stepCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.champagne,
  },

  stepNumber: {
    color: '#080808',
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },


  stepLabel: {
    color: 'rgba(214,180,122,0.72)',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },


  title: {
    color: colors.textPrimary,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.9,
  },

  subtitle: {
    color: '#79756E',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    maxWidth: 340,
  },

  /* ---------------------------------------------------------------
     HOLD TIMER
  --------------------------------------------------------------- */

  holdCard: {
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 21,
    backgroundColor: '#171513',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(214,180,122,0.22)',
    marginBottom: 29,
  },

  holdCardUrgent: {
    backgroundColor: '#191211',
    borderColor: 'rgba(217,107,107,0.28)',
  },

  holdLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  clockCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.28)',
    backgroundColor: 'rgba(214,180,122,0.06)',
  },

  clockCircleUrgent: {
    borderColor: 'rgba(217,107,107,0.34)',
    backgroundColor: 'rgba(217,107,107,0.07)',
  },

  clockHand: {
    width: 10,
    height: 10,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.champagne,
  },

  clockHandUrgent: {
    borderColor: colors.error,
  },


  holdEyebrow: {
    color: '#66615A',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },

  holdTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 3,
  },

  holdTitleUrgent: {
    color: '#E7D9D9',
  },

  timerBlock: {
    alignItems: 'flex-end',
  },


  timerValue: {
    color: colors.champagne,
    fontSize: 22,
    lineHeight: 25,
    fontWeight: typography.fontWeight.bold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },

  timerValueUrgent: {
    color: colors.error,
  },

  timerCaption: {
    color: '#625E58',
    fontSize: 8,
    marginTop: 1,
  },

  /* ---------------------------------------------------------------
     SECTIONS
  --------------------------------------------------------------- */

  section: {
    marginBottom: 25,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
  },


  sectionEyebrow: {
    color: 'rgba(214,180,122,0.68)',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 9,
  },

  quantityLabel: {
    color: '#64605A',
    fontSize: 9,
    paddingBottom: 2,
  },


  editHint: {
    color: '#56524D',
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
        paddingBottom: 2,
  },

  /* ---------------------------------------------------------------
     EVENT CARD
  --------------------------------------------------------------- */

  eventCard: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 94,
    padding: 16,
    borderRadius: 21,
    backgroundColor: '#141414',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  eventAccent: {
    width: 3,
    borderRadius: 3,
    backgroundColor: colors.champagne,
    marginRight: 14,
  },

  eventCopy: {
    flex: 1,
    justifyContent: 'center',
  },


  eventName: {
    color: colors.textPrimary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.25,
  },

  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
  },

  eventInfoText: {
    flexShrink: 1,
    color: '#716D67',
    fontSize: 9,
  },

  infoDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#55514C',
  },

  /* ---------------------------------------------------------------
     PASS CARD
  --------------------------------------------------------------- */

  passCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 75,
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#141414',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  passIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(214,180,122,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(214,180,122,0.18)',
    marginRight: 12,
  },

  passIconInner: {
    width: 15,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.60)',
  },

  passCopy: {
    flex: 1,
  },

  passName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
  },

  passDescription: {
    color: '#6A6660',
    fontSize: 9,
    marginTop: 4,
  },

  passAmount: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: 10,
  },

  /* ---------------------------------------------------------------
     ATTENDEE
  --------------------------------------------------------------- */

  attendeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#141414',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(214,180,122,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(214,180,122,0.22)',
    marginRight: 12,
  },

  avatarText: {
    color: colors.champagne,
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
  },

  attendeeCopy: {
    flex: 1,
  },

  attendeeName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
  },

  attendeeDetail: {
    color: '#69655F',
    fontSize: 9,
    marginTop: 3,
  },

  /* ---------------------------------------------------------------
     PAYMENT
  --------------------------------------------------------------- */

  paymentCard: {
    padding: 17,
    borderRadius: 21,
    backgroundColor: '#141414',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 28,
  },

  priceLabel: {
    color: '#79756E',
    fontSize: 11,
  },

  priceValue: {
    color: '#D4D0C9',
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
  },

  waived: {
    color: colors.success,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },

  paymentDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.09)',
    marginVertical: 12,
  },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  totalLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.4,
  },

  totalSub: {
    color: '#5D5953',
    fontSize: 8,
    marginTop: 3,
  },


  totalValue: {
    color: colors.champagne,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.5,
  },

  /* ---------------------------------------------------------------
     PAYMENT TRUST
  --------------------------------------------------------------- */

  paymentTrust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 3,
    marginTop: -8,
    marginBottom: 15,
  },

  lockIcon: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  lockBody: {
    width: 15,
    height: 12,
    borderRadius: 3,
    backgroundColor: 'rgba(127,191,154,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(127,191,154,0.35)',
  },

  lockTop: {
    position: 'absolute',
    top: 3,
    width: 9,
    height: 9,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(127,191,154,0.35)',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },

  trustCopy: {
    flex: 1,
  },

  trustTitle: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: typography.fontWeight.semibold,
  },

  trustText: {
    color: '#55514C',
    fontSize: 8,
    marginTop: 2,
  },


  cashfree: {
    color: '#55514C',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },

  /* ---------------------------------------------------------------
     FOOTER
  --------------------------------------------------------------- */

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 19,
  },

  footerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },


  footerText: {
    color: '#484540',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },

  /* ---------------------------------------------------------------
     STICKY CTA
  --------------------------------------------------------------- */

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    backgroundColor:
      Platform.OS === 'ios'
        ? 'rgba(5,5,5,0.94)'
        : 'rgba(5,5,5,0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.09)',
  },

  bottomTotal: {
    flex: 1,
    minWidth: 0,
  },


  bottomLabel: {
    color: '#5F5B55',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },


  bottomValue: {
    color: colors.textPrimary,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.3,
    marginTop: 2,
  },

  payButton: {
    minWidth: 150,
  },
});