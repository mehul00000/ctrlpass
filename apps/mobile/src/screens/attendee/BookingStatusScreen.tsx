import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { LoadingSkeleton, ErrorState } from '../../components';
import {
  PrimaryButton,
  SecondaryButton,
} from '../../components/cinema';
import { bookingService } from '../../services/bookings';
import { Booking } from '../../types';
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
  'BookingStatus'
>;

export default function BookingStatusScreen({
  route,
  navigation,
}: Props) {
  const { bookingId } = route.params;

  const insets = useSafeAreaInsets();

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const first =
          await bookingService.getBooking(
            bookingId,
          );

        if (cancelled) return;

        setBooking(first);
        setLoading(false);

        /*
         * Terminal states do not need polling.
         *
         * IMPORTANT:
         * We never assume payment success from
         * the client. The booking state is authoritative.
         */
        if (
          first.status === 'CONFIRMED' ||
          first.status === 'FAILED' ||
          first.status === 'EXPIRED' ||
          first.status === 'CANCELLED'
        ) {
          return;
        }

        const settled =
          await bookingService.waitForConfirmation(
            bookingId,
          );

        if (!cancelled) {
          setBooking(settled);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not fetch order',
          );
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <LoadingSkeleton label="Verifying booking" />
    );
  }

  if (error || !booking) {
    return (
      <ErrorState
        message={
          error ?? 'Order record missing'
        }
        onBack={() =>
          navigation.popToTop()
        }
      />
    );
  }

  const isConfirmed =
    booking.status === 'CONFIRMED';

  const isFailed =
    booking.status === 'FAILED';

  const isExpired =
    booking.status === 'EXPIRED';

  const isCancelled =
    booking.status === 'CANCELLED';

  const isTerminalFailure =
    isFailed ||
    isExpired ||
    isCancelled;

  const state = isConfirmed
    ? 'confirmed'
    : isTerminalFailure
      ? 'failed'
      : 'processing';

  const copy = (() => {
    if (state === 'confirmed') {
      return {
        eyebrow: 'BOOKING CONFIRMED',
        title: 'You’re on the list.',
        subtitle:
          'Your digital passes are ready. Keep them handy when you arrive at the venue.',
      };
    }

    if (state === 'failed') {
      return {
        eyebrow: 'BOOKING NOT COMPLETED',
        title: isExpired
          ? 'Your hold expired.'
          : isCancelled
            ? 'Booking cancelled.'
            : 'Payment could not be confirmed.',
        subtitle:
          'No confirmed ticket has been issued for this booking.',
      };
    }

    return {
      eyebrow: 'VERIFYING PAYMENT',
      title: 'Almost there.',
      subtitle:
        'We’re confirming your payment and securing your booking. This can take a few seconds.',
    };
  })();

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
                145 + insets.bottom,
            },
          ]}
          bounces
          overScrollMode="never"
        >
          {/* -------------------------------------------------------
              HERO
          ------------------------------------------------------- */}

          <View style={s.hero}>
            <View
              style={[
                s.statusOrb,
                state === 'confirmed'
                  ? s.statusOrbConfirmed
                  : state === 'failed'
                    ? s.statusOrbFailed
                    : s.statusOrbProcessing,
              ]}
            >
              {state === 'confirmed' ? (
                <View style={s.checkCircle}>
                  <Text style={s.check}>
                    ✓
                  </Text>
                </View>
              ) : state === 'failed' ? (
                <Text style={s.failedGlyph}>
                  !
                </Text>
              ) : (
                <View style={s.processingCore}>
                  <View style={s.processingDot} />
                  <View
                    style={[
                      s.processingDot,
                      s.processingDotMiddle,
                    ]}
                  />
                  <View style={s.processingDot} />
                </View>
              )}
            </View>

            <Text style={s.eyebrow}>
              {copy.eyebrow}
            </Text>

            <Text style={s.title}>
              {copy.title}
            </Text>

            <Text style={s.subtitle}>
              {copy.subtitle}
            </Text>

            {/* Reference */}

            <View style={s.referenceCard}>
              <Text style={s.referenceLabel}>
                BOOKING REFERENCE
              </Text>

              <Text
                selectable
                style={s.referenceValue}
              >
                {booking.booking_reference}
              </Text>
            </View>
          </View>

          {/* -------------------------------------------------------
              CONFIRMED MESSAGE
          ------------------------------------------------------- */}

          {state === 'confirmed' ? (
            <View style={s.readyBanner}>
              <View style={s.readyIcon}>
                <Text style={s.readyIconText}>
                  ✓
                </Text>
              </View>

              <View style={s.readyCopy}>
                <Text style={s.readyTitle}>
                  Your pass is ready
                </Text>

                <Text style={s.readyText}>
                  Your ticket QR will be available
                  in My Tickets for entry.
                </Text>
              </View>
            </View>
          ) : null}

          {/* -------------------------------------------------------
              PROCESSING MESSAGE
          ------------------------------------------------------- */}

          {state === 'processing' ? (
            <View style={s.processingBanner}>
              <View style={s.processingIndicator}>
                <View style={s.processingIndicatorDot} />
              </View>

              <View style={s.readyCopy}>
                <Text style={s.readyTitle}>
                  Waiting for confirmation
                </Text>

                <Text style={s.readyText}>
                  Please don't close the app while
                  we verify the transaction.
                </Text>
              </View>
            </View>
          ) : null}

          {/* -------------------------------------------------------
              FAILURE MESSAGE
          ------------------------------------------------------- */}

          {state === 'failed' ? (
            <View style={s.failedBanner}>
              <View style={s.failedIcon}>
                <Text style={s.failedIconText}>
                  !
                </Text>
              </View>

              <View style={s.readyCopy}>
                <Text style={s.failedTitle}>
                  No ticket was issued
                </Text>

                <Text style={s.failedText}>
                  You can return to events and
                  select another available pass.
                </Text>
              </View>
            </View>
          ) : null}

          {/* -------------------------------------------------------
              EVENT CARD
          ------------------------------------------------------- */}

          <View style={s.section}>
            <Text style={s.sectionEyebrow}>
              YOUR EVENT
            </Text>

            <View style={s.eventCard}>
              <View
                style={[
                  s.eventAccent,
                  state === 'failed' &&
                    s.eventAccentFailed,
                ]}
              />

              <View style={s.eventContent}>
                <Text
                  style={s.eventName}
                  numberOfLines={3}
                >
                  {booking.event?.name ??
                    'Live Event'}
                </Text>

                <Text style={s.eventTime}>
                  {formatDateTime(
                    booking.event?.start_at ??
                      booking.created_at,
                  )}
                </Text>
              </View>
            </View>
          </View>

          {/* -------------------------------------------------------
              BOOKING DETAILS
          ------------------------------------------------------- */}

          <View style={s.section}>
            <Text style={s.sectionEyebrow}>
              BOOKING DETAILS
            </Text>

            <View style={s.detailsCard}>
              <DetailRow
                label="Attendee"
                value={
                  booking.attendee_name
                }
              />

              <DetailDivider />

              <DetailRow
                label="Passes"
                value={`${booking.ticket_count} ${
                  booking.ticket_count === 1
                    ? 'ticket'
                    : 'tickets'
                }`}
              />

              <DetailDivider />

              <DetailRow
                label="Booking reference"
                value={
                  booking.booking_reference
                }
              />

              <DetailDivider />

              <View style={s.totalRow}>
                <View>
                  <Text style={s.totalLabel}>
                    TOTAL
                  </Text>

                  <Text style={s.totalSub}>
                    {state === 'confirmed'
                      ? 'Payment confirmed'
                      : isFreeBooking(booking)
                        ? 'Free registration'
                        : 'Booking amount'}
                  </Text>
                </View>

                <Text style={s.totalValue}>
                  {formatPaiseCompact(
                    booking.total_amount_minor,
                  )}
                </Text>
              </View>
            </View>
          </View>

          {/* -------------------------------------------------------
              CONFIRMED NEXT STEP
          ------------------------------------------------------- */}

          {state === 'confirmed' ? (
            <View style={s.qrPreview}>
              <View style={s.qrPlaceholder}>
                <View style={s.qrPattern}>
                  <QrSquare />
                  <QrSquare small />
                  <QrSquare />
                  <QrSquare small />
                </View>
              </View>

              <View style={s.qrCopy}>
                <Text style={s.qrTitle}>
                  Digital entry pass
                </Text>

                <Text style={s.qrText}>
                  Your secure QR pass is available
                  inside My Tickets.
                </Text>
              </View>
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
            STICKY ACTIONS
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
          {state === 'confirmed' ? (
            <>
              <PrimaryButton
                title="View My Passes"
                onPress={() =>
                  navigation.navigate(
                    'AttendeeTabs',
                    {
                      tab: 'Tickets',
                    },
                  )
                }
                style={s.primaryAction}
              />

              <SecondaryButton
                title="Explore More Events"
                onPress={() =>
                  navigation.popToTop()
                }
                style={s.secondaryAction}
              />
            </>
          ) : state === 'processing' ? (
            <View style={s.waitingAction}>
              <View style={s.waitingDot} />

              <Text style={s.waitingText}>
                Verifying your booking...
              </Text>
            </View>
          ) : (
            <>
              <PrimaryButton
                title="Explore Events"
                onPress={() =>
                  navigation.popToTop()
                }
                style={s.primaryAction}
              />

              <SecondaryButton
                title="Back"
                onPress={() =>
                  navigation.goBack()
                }
                style={s.secondaryAction}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

/* =================================================================
   HELPERS
================================================================= */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>
        {label}
      </Text>

      <Text
        style={s.detailValue}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function DetailDivider() {
  return <View style={s.detailDivider} />;
}

function isFreeBooking(
  booking: Booking,
) {
  return booking.total_amount_minor === 0;
}

function QrSquare({
  small = false,
}: {
  small?: boolean;
}) {
  return (
    <View
      style={[
        s.qrSquare,
        small && s.qrSquareSmall,
      ]}
    />
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
     HERO
  --------------------------------------------------------------- */

  hero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 27,
  },

  statusOrb: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },

  statusOrbConfirmed: {
    backgroundColor:
      'rgba(214,180,122,0.08)',
    borderColor:
      'rgba(214,180,122,0.30)',
  },

  statusOrbProcessing: {
    backgroundColor:
      'rgba(255,255,255,0.035)',
    borderColor:
      'rgba(255,255,255,0.12)',
  },

  statusOrbFailed: {
    backgroundColor:
      'rgba(217,107,107,0.07)',
    borderColor:
      'rgba(217,107,107,0.25)',
  },

  checkCircle: {
    width: 53,
    height: 53,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(214,180,122,0.13)',
    borderWidth: 1,
    borderColor:
      'rgba(214,180,122,0.42)',
  },

  check: {
    color: colors.champagne,
    fontSize: 29,
    fontWeight: typography.fontWeight.bold,
  },

  failedGlyph: {
    color: colors.error,
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
  },

  processingCore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  processingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      'rgba(214,180,122,0.42)',
  },

  processingDotMiddle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.champagne,
  },


  eyebrow: {
    color: 'rgba(214,180,122,0.72)',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 8,
  },


  title: {
    color: colors.textPrimary,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -1,
    textAlign: 'center',
  },

  subtitle: {
    maxWidth: 350,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 9,
  },

  /* ---------------------------------------------------------------
     REFERENCE
  --------------------------------------------------------------- */

  referenceCard: {
    alignItems: 'center',
    marginTop: 19,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 15,
    backgroundColor: '#111111',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      'rgba(214,180,122,0.16)',
  },


  referenceLabel: {
    color: '#5F5B55',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },


  referenceValue: {
    color: colors.champagne,
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.7,
    marginTop: 3,
  },

  /* ---------------------------------------------------------------
     STATE BANNERS
  --------------------------------------------------------------- */

  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 14,
    borderRadius: 19,
    backgroundColor:
      'rgba(127,191,154,0.055)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      'rgba(127,191,154,0.18)',
    marginBottom: 25,
  },

  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 14,
    borderRadius: 19,
    backgroundColor:
      'rgba(214,180,122,0.045)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      'rgba(214,180,122,0.15)',
    marginBottom: 25,
  },

  failedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 14,
    borderRadius: 19,
    backgroundColor:
      'rgba(217,107,107,0.045)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      'rgba(217,107,107,0.17)',
    marginBottom: 25,
  },

  readyIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(127,191,154,0.10)',
  },

  readyIconText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
  },

  processingIndicator: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(214,180,122,0.09)',
  },

  processingIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.champagne,
  },

  failedIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(217,107,107,0.09)',
  },

  failedIconText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
  },

  readyCopy: {
    flex: 1,
  },

  readyTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
  },

  readyText: {
    color: '#65615B',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  failedTitle: {
    color: '#E3D2D2',
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
  },

  failedText: {
    color: '#71605F',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  /* ---------------------------------------------------------------
     SECTIONS
  --------------------------------------------------------------- */

  section: {
    marginBottom: 25,
  },


  sectionEyebrow: {
    color: 'rgba(214,180,122,0.68)',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 10,
  },

  /* ---------------------------------------------------------------
     EVENT
  --------------------------------------------------------------- */

  eventCard: {
    flexDirection: 'row',
    minHeight: 82,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#141414',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      'rgba(255,255,255,0.08)',
  },

  eventAccent: {
    width: 3,
    backgroundColor: colors.champagne,
  },

  eventAccentFailed: {
    backgroundColor: colors.error,
  },

  eventContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },


  eventName: {
    color: colors.textPrimary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.25,
  },

  eventTime: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 7,
  },

  /* ---------------------------------------------------------------
     DETAILS
  --------------------------------------------------------------- */

  detailsCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#141414',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      'rgba(255,255,255,0.08)',
  },

  detailRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },

  detailLabel: {
    color: '#706C66',
    fontSize: 10,
  },

  detailValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'right',
  },

  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor:
      'rgba(255,255,255,0.065)',
  },

  totalRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  totalLabel: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },

  totalSub: {
    color: '#59554F',
    fontSize: 8,
    marginTop: 3,
  },


  totalValue: {
    color: colors.champagne,
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.4,
  },

  /* ---------------------------------------------------------------
     QR PREVIEW
  --------------------------------------------------------------- */

  qrPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#121212',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      'rgba(214,180,122,0.13)',
    marginBottom: 15,
  },

  qrPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F0E9',
  },

  qrPattern: {
    width: 39,
    height: 39,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'space-between',
    justifyContent: 'space-between',
  },

  qrSquare: {
    width: 14,
    height: 14,
    borderWidth: 3,
    borderColor: '#151515',
  },

  qrSquareSmall: {
    width: 7,
    height: 7,
    borderWidth: 2,
    backgroundColor: '#151515',
  },

  qrCopy: {
    flex: 1,
  },

  qrTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
  },

  qrText: {
    color: '#65615B',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  /* ---------------------------------------------------------------
     FOOTER
  --------------------------------------------------------------- */

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },

  footerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor:
      'rgba(255,255,255,0.07)',
  },


  footerText: {
    color: '#484540',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },

  /* ---------------------------------------------------------------
     STICKY ACTIONS
  --------------------------------------------------------------- */

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: 11,
    backgroundColor:
      Platform.OS === 'ios'
        ? 'rgba(5,5,5,0.95)'
        : 'rgba(5,5,5,0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor:
      'rgba(255,255,255,0.09)',
  },

  primaryAction: {
    width: '100%',
  },

  secondaryAction: {
    width: '100%',
    marginTop: 7,
  },

  waitingAction: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 14,
    backgroundColor: '#151515',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      'rgba(214,180,122,0.15)',
  },

  waitingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.champagne,
  },

  waitingText: {
    color: '#9B968E',
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
  },
});