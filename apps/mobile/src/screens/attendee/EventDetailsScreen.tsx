
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Share,
  StatusBar,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState, LoadingSkeleton } from '../../components';
import { ChevronLeftIcon, ShareIcon } from '../../components/icons';
import {
  PrimaryButton,
  Scrim,
  StatusBadge,
  IconButton,
} from '../../components/cinema';

import { eventService } from '../../services/events';
import { Event, eventIsFree, remainingInventory } from '../../types';
import { AttendeeStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { formatDateTime, formatPaiseCompact } from '../../lib/utils';

type Props = NativeStackScreenProps<
  AttendeeStackParamList,
  'EventDetails'
>;

export default function EventDetailsScreen({
  route,
  navigation,
}: Props) {
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);

  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    try {
      setError(null);

      const e = await eventService.getEvent(route.params.eventId);

      if (!e) {
        setError('Event not found.');
        return;
      }

      setEvent(e);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load this event.',
      );
    }
  }, [route.params.eventId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!event && !error) {
    return <LoadingSkeleton label="CtrlPass" />;
  }

  if (error || !event) {
    return (
      <ErrorState
        message={error ?? 'Missing event'}
        onBack={() => navigation.goBack()}
        onRetry={load}
      />
    );
  }

  const types =
    event.ticket_types?.filter(
      ticket => ticket.visibility === 'VISIBLE',
    ) ?? [];

  const canBuy =
    ['PUBLISHED', 'SALES_OPEN'].includes(event.status) &&
    types.some(ticket => remainingInventory(ticket) > 0);

  const cheapest = types
    .filter(ticket => remainingInventory(ticket) > 0)
    .sort((a, b) => a.price_minor - b.price_minor)[0];

  const isFree = eventIsFree(event);

  const share = () => {
    Share.share({
      message: `${event.name} — ${formatDateTime(event.start_at)}${
        event.venue
          ? ` @ ${event.venue.name}, ${event.venue.city}`
          : ''
      }`,
    }).catch(() => undefined);
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scrollContent,
          {
            paddingBottom:
              150 + Math.max(insets.bottom, spacing.md),
          },
        ]}
        bounces
        overScrollMode="never"
      >
        {/* ---------------------------------------------------------
            HERO
        --------------------------------------------------------- */}

        <View style={s.hero}>
          {event.cover_image_url ? (
            <Image
              source={{ uri: event.cover_image_url }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                s.heroFallback,
              ]}
            >
              <View style={s.heroFallbackOrb} />
              <Text style={s.heroFallbackMark}>CP</Text>
            </View>
          )}

          {/* Dark cinematic treatment */}
          <View
            style={[
              StyleSheet.absoluteFill,
              s.heroColorWash,
            ]}
          />

          <Scrim
            height={1}
            bands={18}
          />

          {/* Small hero metadata */}
          <View
            style={[
              s.heroMeta,
              {
                paddingTop:
                  Math.max(insets.top, spacing.sm) + 58,
              },
            ]}
          >
            <View style={s.heroMetaChip}>
              <View style={s.liveDot} />
              <Text style={s.heroMetaText}>
                {event.status === 'CANCELLED'
                  ? 'CANCELLED'
                  : event.status === 'SALES_CLOSED'
                    ? 'SALES CLOSED'
                    : 'EVENT'}
              </Text>
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------
            MAIN CONTENT
        --------------------------------------------------------- */}

        <View style={s.content}>
          {/* Category / format */}
          <View style={s.badgeRow}>
            <StatusBadge label={event.category} />

            {event.format ? (
              <StatusBadge
                label={event.format}
                tone="neutral"
              />
            ) : null}

            {event.status === 'CANCELLED' ? (
              <StatusBadge
                label="CANCELLED"
                tone="error"
              />
            ) : null}
          </View>

          {/* Event title */}
          <Text style={s.title}>
            {event.name}
          </Text>

          {/* Short description if available */}
          {event.short_description &&
          event.short_description !== event.description ? (
            <Text style={s.lead}>
              {event.short_description}
            </Text>
          ) : null}

          {/* -------------------------------------------------------
              EVENT INFO
          ------------------------------------------------------- */}

          <View style={s.infoCard}>
            <InfoRow
              eyebrow="DATE"
              title={formatDateTime(event.start_at)}
              subtitle={`Until ${formatDateTime(event.end_at)}`}
              first
            />

            {event.venue ? (
              <InfoRow
                eyebrow="VENUE"
                title={event.venue.name}
                subtitle={[
                  event.venue.address_line,
                  event.venue.city,
                ]
                  .filter(Boolean)
                  .join(', ')}
              />
            ) : null}

            {event.organizer ? (
              <View style={s.infoRow}>
                <Text style={s.infoEyebrow}>
                  HOST
                </Text>

                <View style={s.hostContent}>
                  <View style={s.hostAvatar}>
                    <Text style={s.hostAvatarText}>
                      {event.organizer.name
                        .slice(0, 1)
                        .toUpperCase()}
                    </Text>
                  </View>

                  <View style={s.hostCopy}>
                    <Text
                      style={s.infoTitle}
                      numberOfLines={1}
                    >
                      {event.organizer.name}
                    </Text>

                    {event.organizer.verification_status ===
                    'VERIFIED' ? (
                      <View style={s.verifiedRow}>
                        <View style={s.verifiedDot} />
                        <Text style={s.verifiedText}>
                          Verified host
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          {/* -------------------------------------------------------
              ABOUT
          ------------------------------------------------------- */}

          <SectionHeading
            eyebrow="THE EXPERIENCE"
            title="About"
          />

          <Text style={s.bodyText}>
            {event.description ||
              event.short_description ||
              'Event details will be available soon.'}
          </Text>

          {/* -------------------------------------------------------
              PASSES
          ------------------------------------------------------- */}

          <SectionHeading
            eyebrow="ENTRY"
            title="Choose your pass"
          />

          {types.length > 0 ? (
            <View style={s.passList}>
              {types.map((ticket, index) => {
                const remaining =
                  remainingInventory(ticket);

                const soldOut = remaining <= 0;

                return (
                  <View
                    key={ticket.id}
                    style={[
                      s.passRow,
                      index > 0 && s.passDivider,
                    ]}
                  >
                    <View style={s.passLeft}>
                      <View
                        style={[
                          s.ticketMark,
                          soldOut &&
                            s.ticketMarkSoldOut,
                        ]}
                      >
                        <View
                          style={[
                            s.ticketMarkInner,
                            soldOut &&
                              s.ticketMarkInnerSoldOut,
                          ]}
                        />
                      </View>

                      <View style={s.passCopy}>
                        <Text
                          style={[
                            s.passName,
                            soldOut &&
                              s.passNameSoldOut,
                          ]}
                          numberOfLines={1}
                        >
                          {ticket.name}
                        </Text>

                        <Text
                          style={[
                            s.passAvailability,
                            soldOut &&
                              s.passAvailabilitySoldOut,
                          ]}
                        >
                          {soldOut
                            ? 'Sold out'
                            : `${remaining} remaining`}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        s.passPrice,
                        soldOut &&
                          s.passPriceSoldOut,
                      ]}
                    >
                      {ticket.price_minor === 0
                        ? 'FREE'
                        : formatPaiseCompact(
                            ticket.price_minor,
                          )}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={s.noPassCard}>
              <Text style={s.noPassTitle}>
                Tickets aren't available yet
              </Text>
              <Text style={s.noPassText}>
                Check back when ticket sales open.
              </Text>
            </View>
          )}

          {isFree ? (
            <View style={s.freeNote}>
              <View style={s.freeNoteIcon}>
                <Text style={s.freeNoteIconText}>
                  ✓
                </Text>
              </View>

              <Text style={s.freeNoteText}>
                Free registration — no booking fee applied.
              </Text>
            </View>
          ) : null}

          {/* Small end marker */}
          <View style={s.endMark}>
            <View style={s.endLine} />
            <Text style={s.endText}>
              CTRL PASS
            </Text>
            <View style={s.endLine} />
          </View>
        </View>
      </ScrollView>

      {/* -----------------------------------------------------------
          FLOATING TOP CONTROLS
      ----------------------------------------------------------- */}

      <SafeAreaView
        edges={['top']}
        style={s.topControls}
        pointerEvents="box-none"
      >
        <IconButton
          icon={
            <ChevronLeftIcon
              color={colors.textPrimary}
              size={20}
            />
          }
          label="Go back"
          onPress={() => navigation.goBack()}
        />

        <IconButton
          icon={
            <ShareIcon
              color={colors.textPrimary}
              size={18}
            />
          }
          label="Share event"
          onPress={share}
        />
      </SafeAreaView>

      {/* -----------------------------------------------------------
          STICKY PURCHASE BAR
      ----------------------------------------------------------- */}

      <View
        style={[
          s.purchaseArea,
          {
            paddingBottom:
              Math.max(insets.bottom, spacing.md),
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={s.purchaseBar}>
          <View style={s.purchaseInfo}>
            <Text style={s.purchaseEyebrow}>
              {isFree ? 'ENTRY' : 'TICKETS FROM'}
            </Text>

            <Text
              style={s.purchasePrice}
              numberOfLines={1}
            >
              {isFree
                ? 'Free'
                : cheapest
                  ? formatPaiseCompact(
                      cheapest.price_minor,
                    )
                  : 'Pricing TBA'}
            </Text>
          </View>

          <PrimaryButton
            title={
              canBuy
                ? isFree
                  ? 'Register'
                  : 'Get Tickets'
                : 'Sales Closed'
            }
            disabled={!canBuy}
            onPress={() =>
              navigation.navigate(
                'TicketSelection',
                {
                  eventId: event.id,
                },
              )
            }
            style={s.purchaseButton}
          />
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------
   INFO ROW
------------------------------------------------------------------- */

type InfoRowProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  first?: boolean;
};

function InfoRow({
  eyebrow,
  title,
  subtitle,
  first = false,
}: InfoRowProps) {
  return (
    <View
      style={[
        s.infoRow,
        !first && s.infoDivider,
      ]}
    >
      <Text style={s.infoEyebrow}>
        {eyebrow}
      </Text>

      <View style={s.infoCopy}>
        <Text
          style={s.infoTitle}
          numberOfLines={2}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={s.infoSubtitle}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------
   SECTION HEADING
------------------------------------------------------------------- */

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
};

function SectionHeading({
  eyebrow,
  title,
}: SectionHeadingProps) {
  return (
    <View style={s.sectionHeading}>
      <Text style={s.sectionEyebrow}>
        {eyebrow}
      </Text>

      <Text style={s.sectionTitle}>
        {title}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------
   STYLES
------------------------------------------------------------------- */

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },

  scrollContent: {
    flexGrow: 1,
  },

  /* ---------------------------------------------------------------
     HERO
  --------------------------------------------------------------- */

  hero: {
    height: 470,
    backgroundColor: '#0B0B0B',
    overflow: 'hidden',
  },

  heroFallback: {
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  heroFallbackOrb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(184,138,69,0.10)',
    transform: [
      {
        scale: 1.35,
      },
    ],
  },


  heroFallbackMark: {
    color: 'rgba(214,180,122,0.55)',
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -2,
  },

  heroColorWash: {
    backgroundColor: 'rgba(0,0,0,0.08)',
  },

  heroMeta: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 112,
    alignItems: 'flex-start',
  },

  heroMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(8,8,8,0.60)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.champagne,
  },


  heroMetaText: {
    color: '#F4F1EA',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },

  /* ---------------------------------------------------------------
     CONTENT
  --------------------------------------------------------------- */

  content: {
    marginTop: -76,
    paddingHorizontal: spacing.lg,
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: spacing.md,
  },


  title: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -1.05,
    marginBottom: spacing.sm,
  },

  lead: {
    color: '#C0BDB6',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },

  /* ---------------------------------------------------------------
     EVENT INFO CARD
  --------------------------------------------------------------- */

  infoCard: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(19,19,19,0.96)',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  infoDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.075)',
  },


  infoEyebrow: {
    width: 48,
    marginTop: 3,
    color: colors.goldSoft,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: typography.fontWeight.bold,
      },

  infoCopy: {
    flex: 1,
  },

  infoTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: typography.fontWeight.semibold,
  },

  infoSubtitle: {
    color: '#8F8C86',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  hostContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  hostAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(214,180,122,0.11)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(214,180,122,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hostAvatarText: {
    color: colors.champagne,
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
  },

  hostCopy: {
    flex: 1,
  },

  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },

  verifiedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.success,
  },

  verifiedText: {
    color: '#89867F',
    fontSize: 11,
  },

  /* ---------------------------------------------------------------
     SECTION HEADINGS
  --------------------------------------------------------------- */

  sectionHeading: {
    marginTop: 34,
    marginBottom: 14,
  },


  sectionEyebrow: {
    color: colors.goldSoft,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 5,
  },


  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.45,
  },

  bodyText: {
    color: '#AAA69F',
    fontSize: 14,
    lineHeight: 22,
  },

  /* ---------------------------------------------------------------
     PASSES
  --------------------------------------------------------------- */

  passList: {
    backgroundColor: '#141414',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.085)',
    overflow: 'hidden',
  },

  passRow: {
    minHeight: 76,
    paddingHorizontal: 17,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  passDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.075)',
  },

  passLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  ticketMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(214,180,122,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(214,180,122,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ticketMarkInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.champagne,
  },

  ticketMarkSoldOut: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.08)',
  },

  ticketMarkInnerSoldOut: {
    backgroundColor: '#55524D',
  },

  passCopy: {
    flex: 1,
  },

  passName: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: typography.fontWeight.semibold,
  },

  passNameSoldOut: {
    color: '#77736D',
  },

  passAvailability: {
    color: '#85817A',
    fontSize: 11,
    marginTop: 3,
  },

  passAvailabilitySoldOut: {
    color: '#625F5A',
  },

  passPrice: {
    color: colors.champagne,
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
  },

  passPriceSoldOut: {
    color: '#68645E',
  },

  noPassCard: {
    padding: 22,
    borderRadius: 22,
    backgroundColor: '#141414',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  noPassTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
  },

  noPassText: {
    color: '#85817A',
    fontSize: 12,
    marginTop: 5,
  },

  freeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 2,
  },

  freeNoteIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(127,191,154,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  freeNoteIconText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },

  freeNoteText: {
    flex: 1,
    color: colors.success,
    fontSize: 11,
  },

  /* ---------------------------------------------------------------
     END MARK
  --------------------------------------------------------------- */

  endMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 42,
    marginBottom: 12,
  },

  endLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },


  endText: {
    color: '#57544F',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },

  /* ---------------------------------------------------------------
     TOP CONTROLS
  --------------------------------------------------------------- */

  topControls: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
  },

  /* ---------------------------------------------------------------
     PURCHASE BAR
  --------------------------------------------------------------- */

  purchaseArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    backgroundColor:
      Platform.OS === 'ios'
        ? 'rgba(5,5,5,0.90)'
        : 'rgba(5,5,5,0.97)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },

  purchaseBar: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 4,
  },

  purchaseInfo: {
    flex: 1,
    minWidth: 0,
  },


  purchaseEyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 3,
  },

  purchasePrice: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: typography.fontWeight.bold,
  },

  purchaseButton: {
    minWidth: 138,
  },
});
