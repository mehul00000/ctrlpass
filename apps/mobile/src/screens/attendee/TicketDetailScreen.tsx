import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  LoadingSkeleton,
  ErrorState,
} from '../../components';

import {
  TicketQR,
} from '../../components/cinema';

import {
  bookingService,
  ticketQrToken,
} from '../../services/bookings';

import { Ticket } from '../../types';
import { AttendeeStackParamList } from '../../navigation/types';

import {
  colors,
  spacing,
  typography,
} from '../../theme';

import { formatDateTime } from '../../lib/utils';

type Props = NativeStackScreenProps<
  AttendeeStackParamList,
  'TicketDetail'
>;

export default function TicketDetailScreen({
  route,
  navigation,
}: Props) {
  const { ticketId } = route.params;

  const insets = useSafeAreaInsets();

  const [ticket, setTicket] =
    useState<Ticket | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTicket() {
      try {
        setLoading(true);

        const result =
          await bookingService.getTicket(
            ticketId,
          );

        if (cancelled) return;

        if (!result) {
          throw new Error(
            'Ticket not found',
          );
        }

        setTicket(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load pass',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTicket();

    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  if (loading) {
    return (
      <LoadingSkeleton label="Digital Pass" />
    );
  }

  if (error || !ticket) {
    return (
      <ErrorState
        message={
          error ?? 'Ticket unavailable'
        }
        onBack={() => navigation.goBack()}
      />
    );
  }

  /*
   * IMPORTANT:
   * This remains the real gate payload.
   * We never generate or transform the token.
   */
  const qrValue =
    ticketQrToken(ticket) ||
    ticket.ticket_reference;

  const isUsed =
    ticket.status === 'USED';

  const eventName =
    ticket.event?.name ??
    'Live Event';

  const tierName =
    ticket.ticket_type?.name ??
    'Standard Admission';

  const venue =
    ticket.event?.venue;

  return (
    <View style={s.container}>
      <SafeAreaView
        edges={['top']}
        style={s.safeArea}
      >
        {/* =========================================================
            HEADER
        ========================================================= */}

        <View style={s.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              s.iconButton,
              pressed && s.pressed,
            ]}
          >
            <Text style={s.backIcon}>
              ‹
            </Text>
          </Pressable>

          <View style={s.headerCenter}>
            <Text style={s.headerEyebrow}>
              CTRL PASS
            </Text>

            <Text style={s.headerTitle}>
              Digital Pass
            </Text>
          </View>

          <View style={s.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces
          overScrollMode="never"
          contentContainerStyle={[
            s.content,
            {
              paddingBottom:
                100 + insets.bottom,
            },
          ]}
        >
          {/* =======================================================
              PASS
          ======================================================= */}

          <View
            style={[
              s.pass,
              isUsed && s.passUsed,
            ]}
          >
            {/* -----------------------------------------------------
                PASS HEADER
            ----------------------------------------------------- */}

            <View style={s.passHeader}>
              <View style={s.brandMark}>
                <View style={s.brandMarkDot} />

                <Text style={s.brandText}>
                  CTRLPASS
                </Text>
              </View>

              <View
                style={[
                  s.statusPill,
                  isUsed
                    ? s.statusPillUsed
                    : s.statusPillValid,
                ]}
              >
                <View
                  style={[
                    s.statusDot,
                    isUsed
                      ? s.statusDotUsed
                      : s.statusDotValid,
                  ]}
                />

                <Text
                  style={[
                    s.statusText,
                    isUsed
                      ? s.statusTextUsed
                      : s.statusTextValid,
                  ]}
                >
                  {isUsed
                    ? 'CHECKED IN'
                    : 'VALID'}
                </Text>
              </View>
            </View>

            {/* -----------------------------------------------------
                EVENT
            ----------------------------------------------------- */}

            <View style={s.eventBlock}>
              <Text style={s.eventEyebrow}>
                ADMISSION PASS
              </Text>

              <Text
                style={s.eventName}
                numberOfLines={3}
              >
                {eventName}
              </Text>

              <Text style={s.tierName}>
                {tierName}
              </Text>
            </View>

            {/* -----------------------------------------------------
                EVENT META
            ----------------------------------------------------- */}

            <View style={s.metaGrid}>
              <MetaItem
                label="DATE & TIME"
                value={formatDateTime(
                  ticket.event?.start_at ??
                    '',
                )}
              />

              <MetaItem
                label="PASS"
                value={ticket.ticket_reference}
                alignRight
              />
            </View>

            {/* -----------------------------------------------------
                PERFORATION
            ----------------------------------------------------- */}

            <View style={s.perforation}>
              <View style={s.notchLeft} />

              <View style={s.perforationLine}>
                {Array.from({
                  length: 34,
                }).map((_, index) => (
                  <View
                    key={index}
                    style={s.perforationDash}
                  />
                ))}
              </View>

              <View style={s.notchRight} />
            </View>

            {/* -----------------------------------------------------
                QR
            ----------------------------------------------------- */}

            <View style={s.qrSection}>
              <Text style={s.scanEyebrow}>
                {isUsed
                  ? 'ENTRY COMPLETED'
                  : 'SCAN AT THE GATE'}
              </Text>

              <View
                style={[
                  s.qrFrame,
                  isUsed && s.qrFrameUsed,
                ]}
              >
                <TicketQR
                  value={qrValue}
                  size={230}
                />
              </View>

              <Text style={s.scanText}>
                {isUsed
                  ? 'This pass has already been checked in.'
                  : 'Present this QR code to the event scanner.'}
              </Text>
            </View>

            {/* -----------------------------------------------------
                VENUE
            ----------------------------------------------------- */}

            {venue ? (
              <>
                <View style={s.innerDivider} />

                <View style={s.venueSection}>
                  <View style={s.locationIcon}>
                    <Text style={s.locationGlyph}>
                      •
                    </Text>
                  </View>

                  <View style={s.venueCopy}>
                    <Text style={s.venueLabel}>
                      VENUE
                    </Text>

                    <Text
                      style={s.venueName}
                      numberOfLines={2}
                    >
                      {venue.name}
                    </Text>

                    <Text
                      style={s.venueAddress}
                      numberOfLines={3}
                    >
                      {venue.address_line
                        ? `${venue.address_line}, `
                        : ''}
                      {venue.city}
                    </Text>
                  </View>
                </View>
              </>
            ) : null}

            {/* -----------------------------------------------------
                REFERENCE
            ----------------------------------------------------- */}

            <View style={s.reference}>
              <Text style={s.referenceLabel}>
                TICKET REFERENCE
              </Text>

              <Text
                selectable
                style={s.referenceValue}
              >
                {ticket.ticket_reference}
              </Text>
            </View>
          </View>

          {/* =======================================================
              GATE INFORMATION
          ======================================================= */}

          <View style={s.rulesSection}>
            <Text style={s.sectionEyebrow}>
              BEFORE YOU ENTER
            </Text>

            <Text style={s.sectionTitle}>
              Gate verification
            </Text>

            <View style={s.rulesCard}>
              <Rule
                number="01"
                title="Bring your ID"
                description="Carry an official ID matching the booking name."
              />

              <RuleDivider />

              <Rule
                number="02"
                title="Use the original pass"
                description="Screenshots and duplicate scans are rejected at the gate."
              />

              <RuleDivider />

              <Rule
                number="03"
                title="One successful scan"
                description="Once checked in, this pass cannot be used for another entry."
              />
            </View>
          </View>

          {/* =======================================================
              SECURITY NOTE
          ======================================================= */}

          <View style={s.securityNote}>
            <View style={s.securityIcon}>
              <Text style={s.securityIconText}>
                ✓
              </Text>
            </View>

            <View style={s.securityCopy}>
              <Text style={s.securityTitle}>
                Secure digital pass
              </Text>

              <Text style={s.securityText}>
                Your entry code is verified
                server-side at the gate.
              </Text>
            </View>
          </View>

          <Text style={s.footer}>
            CTRL PASS · KEEP THIS SCREEN READY
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* =================================================================
   META
================================================================= */

function MetaItem({
  label,
  value,
  alignRight = false,
}: {
  label: string;
  value: string;
  alignRight?: boolean;
}) {
  return (
    <View
      style={[
        s.metaItem,
        alignRight && s.metaItemRight,
      ]}
    >
      <Text style={s.metaLabel}>
        {label}
      </Text>

      <Text
        style={[
          s.metaValue,
          alignRight && s.metaValueRight,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

/* =================================================================
   RULE
================================================================= */

function Rule({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={s.rule}>
      <Text style={s.ruleNumber}>
        {number}
      </Text>

      <View style={s.ruleCopy}>
        <Text style={s.ruleTitle}>
          {title}
        </Text>

        <Text style={s.ruleDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function RuleDivider() {
  return <View style={s.ruleDivider} />;
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

  pressed: {
    opacity: 0.68,
  },

  /* ---------------------------------------------------------------
     HEADER
  --------------------------------------------------------------- */

  header: {
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      'rgba(255,255,255,0.09)',
  },

  backIcon: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '300',
    marginTop: -3,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },


  headerEyebrow: {
    color:
      'rgba(214,180,122,0.65)',
    fontSize: 11,
    fontWeight:
      typography.fontWeight.bold,
      },

  headerTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight:
      typography.fontWeight.semibold,
    marginTop: 3,
  },

  headerSpacer: {
    width: 42,
  },

  /* ---------------------------------------------------------------
     CONTENT
  --------------------------------------------------------------- */

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
  },

  /* ---------------------------------------------------------------
     PASS
  --------------------------------------------------------------- */

  pass: {
    overflow: 'hidden',
    borderRadius: 26,
    backgroundColor: '#151412',
    borderWidth: 1,
    borderColor:
      'rgba(214,180,122,0.17)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOpacity: 0.38,
        shadowRadius: 25,
        shadowOffset: {
          width: 0,
          height: 14,
        },
      },
      android: {
        elevation: 8,
      },
    }),
  },

  passUsed: {
    borderColor:
      'rgba(255,255,255,0.09)',
  },

  /* ---------------------------------------------------------------
     PASS HEADER
  --------------------------------------------------------------- */

  passHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 19,
  },

  brandMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  brandMarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.champagne,
  },


  brandText: {
    color: '#817B72',
    fontSize: 11,
    fontWeight:
      typography.fontWeight.bold,
      },

  statusPill: {
    height: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
  },

  statusPillValid: {
    backgroundColor:
      'rgba(127,191,154,0.07)',
    borderColor:
      'rgba(127,191,154,0.20)',
  },

  statusPillUsed: {
    backgroundColor:
      'rgba(255,255,255,0.035)',
    borderColor:
      'rgba(255,255,255,0.10)',
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  statusDotValid: {
    backgroundColor: colors.success,
  },

  statusDotUsed: {
    backgroundColor: '#77736C',
  },


  statusText: {
    fontSize: 11,
    fontWeight:
      typography.fontWeight.bold,
      },

  statusTextValid: {
    color: colors.success,
  },

  statusTextUsed: {
    color: '#858078',
  },

  /* ---------------------------------------------------------------
     EVENT
  --------------------------------------------------------------- */

  eventBlock: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
  },


  eventEyebrow: {
    color:
      'rgba(214,180,122,0.64)',
    fontSize: 11,
    fontWeight:
      typography.fontWeight.bold,
        marginBottom: 8,
  },


  eventName: {
    color: colors.textPrimary,
    fontSize: 29,
    lineHeight: 33,
    fontWeight:
      typography.fontWeight.bold,
    letterSpacing: -0.9,
  },

  tierName: {
    color: colors.champagne,
    fontSize: 12,
    fontWeight:
      typography.fontWeight.semibold,
    marginTop: 8,
  },

  /* ---------------------------------------------------------------
     META
  --------------------------------------------------------------- */

  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderTopColor:
      'rgba(255,255,255,0.075)',
  },

  metaItem: {
    flex: 1,
  },

  metaItemRight: {
    alignItems: 'flex-end',
  },


  metaLabel: {
    color: '#5C5851',
    fontSize: 11,
    fontWeight:
      typography.fontWeight.bold,
      },

  metaValue: {
    color: '#D7D4CD',
    fontSize: 9,
    lineHeight: 14,
    fontWeight:
      typography.fontWeight.medium,
    marginTop: 4,
    maxWidth: 185,
  },

  metaValueRight: {
    textAlign: 'right',
    maxWidth: 125,
  },

  /* ---------------------------------------------------------------
     PERFORATION
  --------------------------------------------------------------- */

  perforation: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },

  notchLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.ink,
    marginLeft: -12,
    borderRightWidth:
      StyleSheet.hairlineWidth,
    borderRightColor:
      'rgba(214,180,122,0.15)',
  },

  notchRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.ink,
    marginRight: -12,
    borderLeftWidth:
      StyleSheet.hairlineWidth,
    borderLeftColor:
      'rgba(214,180,122,0.15)',
  },

  perforationLine: {
    flex: 1,
    height: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 7,
    overflow: 'hidden',
  },

  perforationDash: {
    width: 5,
    height: 1,
    backgroundColor:
      'rgba(214,180,122,0.17)',
  },

  /* ---------------------------------------------------------------
     QR
  --------------------------------------------------------------- */

  qrSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 21,
  },


  scanEyebrow: {
    color: '#69645C',
    fontSize: 11,
    fontWeight:
      typography.fontWeight.bold,
        marginBottom: 13,
  },

  qrFrame: {
    padding: 12,
    borderRadius: 17,
    backgroundColor: '#F2F0E9',
    borderWidth: 1,
    borderColor:
      'rgba(214,180,122,0.34)',
  },

  qrFrameUsed: {
    opacity: 0.56,
  },

  scanText: {
    color: '#6B665E',
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 13,
    maxWidth: 260,
  },

  /* ---------------------------------------------------------------
     VENUE
  --------------------------------------------------------------- */

  innerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor:
      'rgba(255,255,255,0.075)',
    marginHorizontal: 20,
  },

  venueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 17,
    gap: 11,
  },

  locationIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(214,180,122,0.07)',
    borderWidth:
      StyleSheet.hairlineWidth,
    borderColor:
      'rgba(214,180,122,0.13)',
  },

  locationGlyph: {
    color: colors.champagne,
    fontSize: 19,
    lineHeight: 20,
    marginTop: -4,
  },

  venueCopy: {
    flex: 1,
  },


  venueLabel: {
    color: '#5C5851',
    fontSize: 11,
    fontWeight:
      typography.fontWeight.bold,
        marginBottom: 4,
  },

  venueName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight:
      typography.fontWeight.semibold,
  },

  venueAddress: {
    color: '#69645D',
    fontSize: 8,
    lineHeight: 12,
    marginTop: 3,
  },

  /* ---------------------------------------------------------------
     REFERENCE
  --------------------------------------------------------------- */

  reference: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 18,
    marginHorizontal: 20,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderTopColor:
      'rgba(255,255,255,0.065)',
  },


  referenceLabel: {
    color: '#4F4B45',
    fontSize: 11,
    fontWeight:
      typography.fontWeight.bold,
      },


  referenceValue: {
    color: '#8A857D',
    fontSize: 11,
    fontWeight:
      typography.fontWeight.semibold,
        marginTop: 4,
  },

  /* ---------------------------------------------------------------
     RULES
  --------------------------------------------------------------- */

  rulesSection: {
    marginTop: 28,
  },


  sectionEyebrow: {
    color:
      'rgba(214,180,122,0.62)',
    fontSize: 11,
    fontWeight:
      typography.fontWeight.bold,
        marginBottom: 5,
  },


  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight:
      typography.fontWeight.bold,
    letterSpacing: -0.25,
    marginBottom: 11,
  },

  rulesCard: {
    borderRadius: 20,
    backgroundColor: '#121212',
    borderWidth:
      StyleSheet.hairlineWidth,
    borderColor:
      'rgba(255,255,255,0.075)',
    paddingHorizontal: 15,
  },

  rule: {
    flexDirection: 'row',
    paddingVertical: 15,
  },


  ruleNumber: {
    width: 28,
    color:
      'rgba(214,180,122,0.45)',
    fontSize: 11,
    fontWeight:
      typography.fontWeight.bold,
        paddingTop: 2,
  },

  ruleCopy: {
    flex: 1,
  },

  ruleTitle: {
    color: '#E5E3DE',
    fontSize: 10,
    fontWeight:
      typography.fontWeight.semibold,
  },

  ruleDescription: {
    color: '#65615B',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  ruleDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor:
      'rgba(255,255,255,0.06)',
  },

  /* ---------------------------------------------------------------
     SECURITY
  --------------------------------------------------------------- */

  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 13,
    padding: 13,
    borderRadius: 17,
    backgroundColor:
      'rgba(127,191,154,0.035)',
    borderWidth:
      StyleSheet.hairlineWidth,
    borderColor:
      'rgba(127,191,154,0.13)',
  },

  securityIcon: {
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(127,191,154,0.08)',
  },

  securityIconText: {
    color: colors.success,
    fontSize: 12,
    fontWeight:
      typography.fontWeight.bold,
  },

  securityCopy: {
    flex: 1,
  },

  securityTitle: {
    color: '#B7C7BD',
    fontSize: 9,
    fontWeight:
      typography.fontWeight.semibold,
  },

  securityText: {
    color: '#5E6962',
    fontSize: 8,
    lineHeight: 12,
    marginTop: 2,
  },


  footer: {
    color: '#3F3C38',
    fontSize: 11,
    fontWeight:
      typography.fontWeight.bold,
        textAlign: 'center',
    marginTop: 25,
  },
});