import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingSkeleton, ErrorState } from '../../components';
import {
  PrimaryButton,
  QuantitySelector,
  StatusBadge,
  Eyebrow,
} from '../../components/cinema';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/events';
import {
  Event,
  TicketType,
  remainingInventory,
} from '../../types';
import { AttendeeStackParamList, RootStackParamList } from '../../navigation/types';
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
  'TicketSelection'
>;

export default function TicketSelectionScreen({
  route,
  navigation,
}: Props) {
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { eventId } = route.params;
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setError(null);

      const [eventData, types] = await Promise.all([
        eventService.getEvent(eventId),
        eventService.getTicketTypes(eventId),
      ]);

      if (!eventData) {
        throw new Error('Event not found');
      }

      setEvent(eventData);

      const visible = types.filter(
        ticket =>
          ticket.visibility === 'VISIBLE' &&
          ticket.status === 'ACTIVE',
      );

      setTicketTypes(visible);

      if (visible.length > 0) {
        const first = visible[0];

        setSelectedTypeId(first.id);

        setQuantity(
          Math.max(
            1,
            Math.min(
              first.min_per_booking,
              first.max_per_booking,
              Math.max(1, remainingInventory(first)),
            ),
          ),
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load tickets',
      );
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const activeTier = useMemo(
    () =>
      ticketTypes.find(
        ticket => ticket.id === selectedTypeId,
      ) ?? null,
    [ticketTypes, selectedTypeId],
  );

  const available = activeTier
    ? remainingInventory(activeTier)
    : 0;

  const maxAllowed = activeTier
    ? Math.min(
        activeTier.max_per_booking,
        Math.max(0, available),
      )
    : 1;

  const minAllowed = activeTier
    ? Math.min(
        Math.max(1, activeTier.min_per_booking),
        Math.max(1, maxAllowed),
      )
    : 1;

  const subtotal = activeTier
    ? activeTier.price_minor * quantity
    : 0;

  const isFree = activeTier?.price_minor === 0;

  const handleSelectTier = (tier: TicketType) => {
    const remaining = remainingInventory(tier);

    if (remaining <= 0) {
      return;
    }

    const max = Math.min(
      tier.max_per_booking,
      remaining,
    );

    const nextQuantity = Math.min(
      Math.max(1, tier.min_per_booking),
      max,
    );

    setSelectedTypeId(tier.id);
    setQuantity(nextQuantity);
  };

  const handleQuantityChange = (value: number) => {
    if (!activeTier) return;

    const safeValue = Math.max(
      minAllowed,
      Math.min(maxAllowed, value),
    );

    setQuantity(safeValue);
  };

  const handleContinue = () => {
    if (!activeTier) {
      Alert.alert(
        'Select a pass',
        'Choose an available pass to continue.',
      );
      return;
    }

    if (available <= 0) {
      Alert.alert(
        'Sold out',
        'This pass is no longer available.',
      );
      return;
    }

    if (
      quantity < minAllowed ||
      quantity > maxAllowed
    ) {
      Alert.alert(
        'Quantity unavailable',
        `Choose between ${minAllowed} and ${maxAllowed} passes.`,
      );
      return;
    }

    if (!session) {
      Alert.alert(
        'Sign In Required',
        'Please sign in or create an account with your phone number to secure a 10-minute pass hold and complete your booking.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign In',
            onPress: () =>
              rootNavigation.navigate('Auth'),
          },
        ],
      );

      return;
    }

    navigation.navigate('AttendeeDetails', {
      eventId,
      ticketTypeId: activeTier.id,
      quantity,
    });
  };

  if (loading) {
    return (
      <LoadingSkeleton label="Select Tickets" />
    );
  }

  if (error || !event) {
    return (
      <ErrorState
        message={
          error ?? 'Event unavailable'
        }
        onRetry={load}
        onBack={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={s.container}>
      <SafeAreaView
        edges={['top']}
        style={s.safeArea}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.scrollContent,
            {
              paddingBottom:
                170 + insets.bottom,
            },
          ]}
          bounces
          overScrollMode="never"
        >
          {/* -------------------------------------------------------
              HEADER
          ------------------------------------------------------- */}

          <View style={s.header}>
            <Eyebrow>
              {formatDateTime(event.start_at)}
            </Eyebrow>

            <Text
              style={s.eventName}
              numberOfLines={3}
            >
              {event.name}
            </Text>

            <View style={s.eventMeta}>
              <View style={s.metaDot} />

              <Text
                style={s.eventVenue}
                numberOfLines={1}
              >
                {event.venue?.name
                  ? `${event.venue.name}${
                      event.venue.city
                        ? ` · ${event.venue.city}`
                        : ''
                    }`
                  : 'Live venue'}
              </Text>
            </View>
          </View>

          {/* -------------------------------------------------------
              STEP INDICATOR
          ------------------------------------------------------- */}

          <View
            style={s.progress}
            accessible
            accessibilityLabel="Step 1 of 2: Select your passes"
          >
            <View style={s.progressItem}>
              <View style={s.progressNumberActive}>
                <Text style={s.progressNumberText}>
                  1
                </Text>
              </View>

              <Text style={s.progressTextActive}>
                Passes
              </Text>
            </View>

            <View style={s.progressLine} />

            <View style={s.progressItem}>
              <View style={s.progressNumber}>
                <Text style={s.progressNumberMuted}>
                  2
                </Text>
              </View>

              <Text style={s.progressText}>
                Details
              </Text>
            </View>
          </View>

          {/* -------------------------------------------------------
              SECTION
          ------------------------------------------------------- */}

          <View style={s.sectionHeading}>
            <View>
              <Text style={s.sectionEyebrow}>
                ENTRY
              </Text>

              <Text style={s.sectionTitle}>
                Choose your pass
              </Text>
            </View>

            {ticketTypes.length > 0 ? (
              <Text style={s.tierCount}>
                {ticketTypes.length}{' '}
                {ticketTypes.length === 1
                  ? 'option'
                  : 'options'}
              </Text>
            ) : null}
          </View>

          {/* -------------------------------------------------------
              TICKET TYPES
          ------------------------------------------------------- */}

          {ticketTypes.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyTitle}>
                No passes available
              </Text>

              <Text style={s.emptyText}>
                Ticket sales for this event aren't
                available right now.
              </Text>
            </View>
          ) : (
            <View style={s.ticketList}>
              {ticketTypes.map((tier, index) => {
                const isSelected =
                  tier.id === selectedTypeId;

                const remaining =
                  remainingInventory(tier);

                const soldOut =
                  remaining <= 0;

                return (
                  <Pressable
                    key={tier.id}
                    onPress={() =>
                      handleSelectTier(tier)
                    }
                    disabled={soldOut}
                    accessibilityRole="radio"
                    accessibilityState={{
                      selected: isSelected,
                      disabled: soldOut,
                    }}
                    accessibilityLabel={`${tier.name}, ${
                      tier.price_minor === 0
                        ? 'free'
                        : formatPaiseCompact(
                            tier.price_minor,
                          )
                    }`}
                    hitSlop={4}
                    style={({ pressed }) => [
                      s.ticketCard,
                      index > 0 &&
                        s.ticketCardSpacing,
                      isSelected &&
                        s.ticketCardSelected,
                      soldOut &&
                        s.ticketCardSoldOut,
                      pressed &&
                        !soldOut &&
                        s.ticketCardPressed,
                    ]}
                  >
                    {/* Accent rail */}
                    {isSelected ? (
                      <View
                        style={s.selectedRail}
                      />
                    ) : null}

                    <View style={s.ticketTop}>
                      <View style={s.ticketIdentity}>
                        <View
                          style={[
                            s.ticketIcon,
                            isSelected &&
                              s.ticketIconSelected,
                            soldOut &&
                              s.ticketIconSoldOut,
                          ]}
                        >
                          <View
                            style={[
                              s.ticketIconDot,
                              isSelected &&
                                s.ticketIconDotSelected,
                            ]}
                          />
                        </View>

                        <View
                          style={s.ticketCopy}
                        >
                          <View
                            style={
                              s.ticketTitleRow
                            }
                          >
                            <Text
                              style={[
                                s.ticketTitle,
                                soldOut &&
                                  s.ticketTitleSoldOut,
                              ]}
                              numberOfLines={1}
                            >
                              {tier.name}
                            </Text>

                            {isSelected ? (
                              <StatusBadge
                                label="SELECTED"
                              />
                            ) : null}
                          </View>

                          {tier.description ? (
                            <Text
                              style={s.ticketDescription}
                              numberOfLines={3}
                            >
                              {tier.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View
                        style={s.priceBlock}
                      >
                        <Text
                          style={[
                            s.ticketPrice,
                            soldOut &&
                              s.ticketPriceSoldOut,
                          ]}
                        >
                          {tier.price_minor === 0
                            ? 'FREE'
                            : formatPaiseCompact(
                                tier.price_minor,
                              )}
                        </Text>

                        {tier.price_minor !== 0 ? (
                          <Text
                            style={s.perPerson}
                          >
                            per pass
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View
                      style={s.ticketBottom}
                    >
                      <View
                        style={s.availabilityWrap}
                      >
                        <View
                          style={[
                            s.availabilityDot,
                            soldOut &&
                              s.availabilityDotSoldOut,
                            remaining < 20 &&
                              !soldOut &&
                              s.availabilityDotLow,
                          ]}
                        />

                        <Text
                          style={[
                            s.availability,
                            soldOut &&
                              s.availabilitySoldOut,
                            remaining < 20 &&
                              !soldOut &&
                              s.availabilityLow,
                          ]}
                        >
                          {soldOut
                            ? 'Sold out'
                            : remaining < 20
                              ? `Only ${remaining} left`
                              : `${remaining} available`}
                        </Text>
                      </View>

                      {isSelected &&
                      !soldOut ? (
                        <View
                          style={s.quantityWrap}
                        >
                          <QuantitySelector
                            value={quantity}
                            min={minAllowed}
                            max={maxAllowed}
                            onChange={
                              handleQuantityChange
                            }
                            onLimit={() =>
                              Alert.alert(
                                'Limit reached',
                                `Maximum ${maxAllowed} passes allowed for this tier.`,
                              )
                            }
                          />
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* -------------------------------------------------------
              BOOKING NOTE
          ------------------------------------------------------- */}

          {activeTier && available > 0 ? (
            <View style={s.bookingNote}>
              <View style={s.noteMark}>
                <Text style={s.noteMarkText}>
                  i
                </Text>
              </View>

              <Text style={s.bookingNoteText}>
                Your selected passes will be held
                temporarily when you continue.
              </Text>
            </View>
          ) : null}

          {/* -------------------------------------------------------
              FOOTER
          ------------------------------------------------------- */}

          <View style={s.footerMark}>
            <View style={s.footerLine} />

            <Text style={s.footerText}>
              CTRL PASS
            </Text>

            <View style={s.footerLine} />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* -----------------------------------------------------------
          STICKY PURCHASE BAR
      ----------------------------------------------------------- */}

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
        <View style={s.totalBlock}>
          <Text style={s.totalLabel}>
            {quantity}{' '}
            {quantity === 1
              ? 'PASS'
              : 'PASSES'}
          </Text>

          <Text style={s.totalValue}>
            {subtotal === 0
              ? 'FREE'
              : formatPaiseCompact(subtotal)}
          </Text>

          {!isFree && activeTier ? (
            <Text style={s.totalHint}>
              Before applicable booking fee
            </Text>
          ) : null}
        </View>

        <PrimaryButton
          title="Continue"
          disabled={
            !activeTier ||
            available <= 0 ||
            quantity < minAllowed ||
            quantity > maxAllowed
          }
          onPress={handleContinue}
          style={s.continueButton}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  /* ---------------------------------------------------------------
     HEADER
  --------------------------------------------------------------- */

  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },


  eventName: {
    color: colors.textPrimary,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.85,
    marginTop: 7,
  },

  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 9,
  },

  metaDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.champagne,
  },

  eventVenue: {
    flex: 1,
    color: '#85817A',
    fontSize: 12,
  },

  /* ---------------------------------------------------------------
     PROGRESS
  --------------------------------------------------------------- */

  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },

  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  progressNumberActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.champagne,
  },

  progressNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161616',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  progressNumberText: {
    color: '#080808',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },

  progressNumberMuted: {
    color: '#6D6963',
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
  },

  progressTextActive: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
  },

  progressText: {
    color: '#65615B',
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
  },

  progressLine: {
    width: 38,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.11)',
    marginHorizontal: 10,
  },

  /* ---------------------------------------------------------------
     SECTION
  --------------------------------------------------------------- */

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },


  sectionEyebrow: {
    color: 'rgba(214,180,122,0.68)',
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

  tierCount: {
    color: '#66625C',
    fontSize: 10,
    paddingBottom: 3,
  },

  /* ---------------------------------------------------------------
     TICKET CARD
  --------------------------------------------------------------- */

  ticketList: {
    width: '100%',
  },

  ticketCard: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 145,
    paddingHorizontal: 17,
    paddingVertical: 17,
    borderRadius: 23,
    backgroundColor: '#141414',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
  },

  ticketCardSpacing: {
    marginTop: 11,
  },

  ticketCardSelected: {
    backgroundColor: '#171614',
    borderColor: 'rgba(214,180,122,0.42)',
  },

  ticketCardSoldOut: {
    opacity: 0.48,
  },

  ticketCardPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.9,
  },

  selectedRail: {
    position: 'absolute',
    top: 15,
    bottom: 15,
    left: 0,
    width: 3,
    borderRadius: 3,
    backgroundColor: colors.champagne,
  },

  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },

  ticketIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  ticketIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  ticketIconSelected: {
    backgroundColor: 'rgba(214,180,122,0.11)',
    borderColor: 'rgba(214,180,122,0.25)',
  },

  ticketIconSoldOut: {
    backgroundColor: '#151515',
  },

  ticketIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6C6862',
  },

  ticketIconDotSelected: {
    backgroundColor: colors.champagne,
  },

  ticketCopy: {
    flex: 1,
  },

  ticketTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },

  ticketTitle: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: typography.fontWeight.semibold,
  },

  ticketTitleSoldOut: {
    color: '#74706A',
  },

  ticketDescription: {
    color: '#7F7B75',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  priceBlock: {
    alignItems: 'flex-end',
    paddingTop: 1,
  },

  ticketPrice: {
    color: colors.champagne,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: typography.fontWeight.bold,
  },

  ticketPriceSoldOut: {
    color: '#6A6660',
  },

  perPerson: {
    color: '#65615B',
    fontSize: 9,
    marginTop: 2,
  },

  ticketBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 17,
  },

  availabilityWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  availabilityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.success,
  },

  availabilityDotLow: {
    backgroundColor: colors.warning,
  },

  availabilityDotSoldOut: {
    backgroundColor: '#55514C',
  },

  availability: {
    color: colors.textMuted,
    fontSize: 10,
  },

  availabilityLow: {
    color: colors.warning,
    fontWeight: typography.fontWeight.semibold,
  },

  availabilitySoldOut: {
    color: '#66615B',
  },

  quantityWrap: {
    alignItems: 'flex-end',
  },

  /* ---------------------------------------------------------------
     EMPTY
  --------------------------------------------------------------- */

  emptyCard: {
    padding: 22,
    borderRadius: 22,
    backgroundColor: '#141414',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  /* ---------------------------------------------------------------
     BOOKING NOTE
  --------------------------------------------------------------- */

  bookingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 14,
    paddingHorizontal: 2,
  },

  noteMark: {
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(214,180,122,0.09)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(214,180,122,0.18)',
  },

  noteMarkText: {
    color: colors.champagne,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },

  bookingNoteText: {
    flex: 1,
    color: '#6F6B65',
    fontSize: 10,
    lineHeight: 15,
  },

  /* ---------------------------------------------------------------
     FOOTER
  --------------------------------------------------------------- */

  footerMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 42,
  },

  footerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },


  footerText: {
    color: '#4F4C47',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },

  /* ---------------------------------------------------------------
     STICKY BAR
  --------------------------------------------------------------- */

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    backgroundColor:
      Platform.OS === 'ios'
        ? 'rgba(5,5,5,0.92)'
        : 'rgba(5,5,5,0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.09)',
  },

  totalBlock: {
    flex: 1,
    minWidth: 0,
  },


  totalLabel: {
    color: '#6D6963',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },


  totalValue: {
    color: colors.textPrimary,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.4,
    marginTop: 2,
  },

  totalHint: {
    color: '#595650',
    fontSize: 8,
    marginTop: 2,
  },

  continueButton: {
    minWidth: 140,
  },
});