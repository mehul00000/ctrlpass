import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Platform,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  LoadingSkeleton,
} from '../../components';

import { bookingService, ticketQrToken } from '../../services/bookings';
import { Ticket } from '../../types';
import { AttendeeStackParamList } from '../../navigation/types';

import { colors, spacing, typography } from '../../theme';
import { formatDateTime } from '../../lib/utils';
import { Tabs, TabsList, TabsTrigger } from '../../components/tabs';

type Filter = 'ACTIVE' | 'USED';

type NavigationProp =
  NativeStackNavigationProp<AttendeeStackParamList>;

export default function TicketsScreen() {
  const navigation =
    useNavigation<NavigationProp>();

  const insets = useSafeAreaInsets();

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [filter, setFilter] =
    useState<Filter>('ACTIVE');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const list =
          await bookingService.listMyTickets();

        setTickets(list);
      } catch {
        // Keep existing ticket state if a refresh fails.
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) =>
        filter === 'ACTIVE'
          ? ticket.status === 'ACTIVE'
          : ticket.status !== 'ACTIVE',
      ),
    [tickets, filter],
  );

  const activeCount = useMemo(
    () =>
      tickets.filter(
        ticket => ticket.status === 'ACTIVE',
      ).length,
    [tickets],
  );

  const pastCount = useMemo(
    () =>
      tickets.filter(
        ticket => ticket.status !== 'ACTIVE',
      ).length,
    [tickets],
  );

  const renderTicket = useCallback(
    ({ item, index }: { item: Ticket; index: number }) => (
      <TicketWalletCard
        ticket={item}
        index={index}
        onPress={() =>
          navigation.navigate('TicketDetail', {
            ticketId: item.id,
          })
        }
      />
    ),
    [navigation],
  );

  if (loading) {
    return (
      <LoadingSkeleton label="My Passes" />
    );
  }

  return (
    <View style={s.container}>
      <SafeAreaView
        edges={['top']}
        style={s.safeArea}
      >
        <FlatList
          data={filteredTickets}
          keyExtractor={ticket => ticket.id}
          showsVerticalScrollIndicator={false}
          bounces
          overScrollMode="never"
          contentContainerStyle={[
            s.listContent,
            {
              paddingBottom:
                115 + insets.bottom,
            },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.champagne}
              progressBackgroundColor="#141414"
            />
          }
          ListHeaderComponent={
            <View>
              {/* ---------------------------------------------------
                  HEADER
              --------------------------------------------------- */}

              <View style={s.header}>
                <View>
                  <Text style={s.eyebrow}>
                    YOUR WALLET
                  </Text>

                  <Text style={s.title}>
                    My Passes
                  </Text>

                  <Text style={s.subtitle}>
                    Everything you need for your
                    next entry.
                  </Text>
                </View>

                <View style={s.totalBadge}>
                  <Text style={s.totalNumber}>
                    {tickets.length}
                  </Text>

                  <Text style={s.totalLabel}>
                    TOTAL
                  </Text>
                </View>
              </View>

              {/* ---------------------------------------------------
                  FILTER
              --------------------------------------------------- */}

              <View style={s.filterShell}>
                <Tabs
                  value={filter}
                  onValueChange={(value) =>
                    setFilter(value as Filter)
                  }
                  variant="segment"
                >
                  <TabsList>
                    <TabsTrigger value="ACTIVE">
                      Active · {activeCount}
                    </TabsTrigger>

                    <TabsTrigger value="USED">
                      Past · {pastCount}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </View>

              {/* ---------------------------------------------------
                  SECTION LABEL
              --------------------------------------------------- */}

              <View style={s.sectionHeader}>
                <View>
                  <Text style={s.sectionEyebrow}>
                    {filter === 'ACTIVE'
                      ? 'READY TO GO'
                      : 'YOUR HISTORY'}
                  </Text>

                  <Text style={s.sectionTitle}>
                    {filter === 'ACTIVE'
                      ? 'Upcoming passes'
                      : 'Past passes'}
                  </Text>
                </View>

                <Text style={s.resultCount}>
                  {filteredTickets.length}{' '}
                  {filteredTickets.length === 1
                    ? 'PASS'
                    : 'PASSES'}
                </Text>
              </View>
            </View>
          }
          renderItem={renderTicket}
          ListEmptyComponent={
            <TicketsEmptyState
              filter={filter}
              onExplore={() =>
                navigation.popToTop()
              }
            />
          }
        />
      </SafeAreaView>
    </View>
  );
}

/* =================================================================
   FILTER
================================================================= */


/* =================================================================
   TICKET CARD
================================================================= */

function TicketWalletCard({
  ticket,
  index,
  onPress,
}: {
  ticket: Ticket;
  index: number;
  onPress: () => void;
}) {
  const isActive =
    ticket.status === 'ACTIVE';

  const qrValue =
    ticketQrToken(ticket) ||
    ticket.ticket_reference;

  const eventName =
    ticket.event?.name ??
    'Live Event';

  const tierName =
    ticket.ticket_type?.name ??
    'Standard Admission';

  const dateText =
    formatDateTime(
      ticket.event?.start_at ??
        ticket.issued_at ??
        '',
    );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${eventName} ticket`}
      style={({ pressed }) => [
        s.ticketCard,
        pressed && s.cardPressed,
      ]}
    >
      {/* =========================================================
          IMAGE / VISUAL HEADER
          ========================================================= */}

      <View style={s.ticketVisual}>
        <View style={s.ticketVisualGlow} />

        <View style={s.ticketVisualTop}>
          <View
            style={[
              s.statusBadge,
              isActive
                ? s.statusBadgeActive
                : s.statusBadgePast,
            ]}
          >
            <View
              style={[
                s.statusDot,
                isActive
                  ? s.statusDotActive
                  : s.statusDotPast,
              ]}
            />

            <Text
              style={[
                s.statusText,
                isActive
                  ? s.statusTextActive
                  : s.statusTextPast,
              ]}
            >
              {isActive
                ? 'VALID PASS'
                : ticket.status}
            </Text>
          </View>

          <Text style={s.passNumber}>
            PASS {String(index + 1).padStart(2, '0')}
          </Text>
        </View>

        <View style={s.eventHeroCopy}>
          <Text
            style={s.eventName}
            numberOfLines={2}
          >
            {eventName}
          </Text>

          <Text style={s.eventDate}>
            {dateText}
          </Text>
        </View>

        <View style={s.ticketVisualBottom}>
          <Text style={s.formatLabel}>
            CTRL PASS
          </Text>

          <Text style={s.referenceSmall}>
            {ticket.ticket_reference}
          </Text>
        </View>
      </View>

      {/* =========================================================
          TICKET BODY
          ========================================================= */}

      <View style={s.ticketBody}>
        <View style={s.ticketInfo}>
          <Text style={s.infoLabel}>
            ADMISSION
          </Text>

          <Text
            style={s.tierName}
            numberOfLines={1}
          >
            {tierName}
          </Text>
        </View>

        <View style={s.ticketDivider} />

        <View style={s.ticketInfo}>
          <Text style={s.infoLabel}>
            STATUS
          </Text>

          <Text style={s.ticketStatus}>
            {isActive
              ? 'Ready for entry'
              : 'Past event'}
          </Text>
        </View>

        {/* -----------------------------------------------
            QR INDICATOR
        ------------------------------------------------ */}

        <View style={s.qrRow}>
          <View style={s.qrMini}>
            <MiniQr />
          </View>

          <View style={s.qrCopy}>
            <Text style={s.qrTitle}>
              Digital entry pass
            </Text>

            <Text style={s.qrSubtitle}>
              Tap to open your secure ticket
            </Text>
          </View>

          <View style={s.arrowCircle}>
            <Text style={s.arrow}>
              →
            </Text>
          </View>
        </View>

        {/* Keep the actual QR value part of the
            ticket rendering contract without displaying
            the raw token in the wallet UI. */}
        {qrValue ? null : null}
      </View>
    </Pressable>
  );
}

/* =================================================================
   EMPTY STATE
================================================================= */

function TicketsEmptyState({
  filter,
  onExplore,
}: {
  filter: Filter;
  onExplore: () => void;
}) {
  const active = filter === 'ACTIVE';

  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyVisual}>
        <View style={s.emptyTicket}>
          <View style={s.emptyTicketTop} />

          <View style={s.emptyTicketLine} />

          <View
            style={[
              s.emptyTicketLine,
              s.emptyTicketLineShort,
            ]}
          />
        </View>

        <View style={s.emptyRing} />
      </View>

      <Text style={s.emptyEyebrow}>
        {active
          ? 'NOTHING HERE YET'
          : 'NO HISTORY'}
      </Text>

      <Text style={s.emptyTitle}>
        {active
          ? 'Your next experience starts here.'
          : 'Your past passes will live here.'}
      </Text>

      <Text style={s.emptyDescription}>
        {active
          ? 'Discover events, choose your pass, and your confirmed tickets will appear here.'
          : 'Once you attend an event, its ticket will remain available in your pass history.'}
      </Text>

      {active ? (
        <Pressable
          onPress={onExplore}
          style={({ pressed }) => [
            s.exploreButton,
            pressed && s.pressed,
          ]}
        >
          <Text style={s.exploreButtonText}>
            Explore Events
          </Text>

          <Text style={s.exploreArrow}>
            →
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* =================================================================
   MINI QR
================================================================= */

function MiniQr() {
  return (
    <View style={s.miniQrGrid}>
      <View style={s.qrBlockLarge} />
      <View style={s.qrBlockSmall} />
      <View style={s.qrBlockMedium} />
      <View style={s.qrBlockSmall} />
      <View style={s.qrBlockLarge} />
      <View style={s.qrBlockSmall} />
      <View style={s.qrBlockMedium} />
      <View style={s.qrBlockLarge} />
      <View style={s.qrBlockSmall} />
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

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
  },

  pressed: {
    opacity: 0.72,
  },

  cardPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.96,
  },

  /* ---------------------------------------------------------------
     HEADER
  --------------------------------------------------------------- */

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 23,
  },


  eyebrow: {
    color: 'rgba(214,180,122,0.68)',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 7,
  },


  title: {
    color: colors.textPrimary,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -1.1,
  },

  subtitle: {
    color: '#706C66',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
    maxWidth: 235,
  },

  totalBadge: {
    minWidth: 53,
    height: 53,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#111111',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      'rgba(214,180,122,0.17)',
  },

  totalNumber: {
    color: colors.champagne,
    fontSize: 19,
    lineHeight: 21,
    fontWeight: typography.fontWeight.bold,
  },


  totalLabel: {
    color: '#55514B',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginTop: 2,
  },

  /* ---------------------------------------------------------------
     FILTER
  --------------------------------------------------------------- */

  filterShell: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#0D0D0D',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      'rgba(255,255,255,0.065)',
    marginBottom: 27,
  },

  filter: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
  },

  filterActive: {
    backgroundColor: '#1A1A1A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      'rgba(214,180,122,0.18)',
  },

  filterLabel: {
    color: '#69655E',
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },

  filterLabelActive: {
    color: colors.textPrimary,
  },

  filterCount: {
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#171717',
  },

  filterCountActive: {
    backgroundColor:
      'rgba(214,180,122,0.10)',
  },

  filterCountText: {
    color: '#55514B',
    fontSize: 8,
    fontWeight: typography.fontWeight.bold,
  },

  filterCountTextActive: {
    color: colors.champagne,
  },

  /* ---------------------------------------------------------------
     SECTION HEADER
  --------------------------------------------------------------- */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 11,
  },


  sectionEyebrow: {
    color: '#5C5852',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 3,
  },


  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.25,
  },


  resultCount: {
    color: '#55514B',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        paddingBottom: 2,
  },

  /* ---------------------------------------------------------------
     TICKET CARD
  --------------------------------------------------------------- */

  ticketCard: {
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#121212',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      'rgba(255,255,255,0.085)',
    marginBottom: 17,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOpacity: 0.28,
        shadowRadius: 18,
        shadowOffset: {
          width: 0,
          height: 9,
        },
      },
      android: {
        elevation: 5,
      },
    }),
  },

  /* ---------------------------------------------------------------
     VISUAL HEADER
  --------------------------------------------------------------- */

  ticketVisual: {
    height: 166,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1A1815',
  },

  ticketVisualGlow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    right: -70,
    top: -110,
    backgroundColor:
      'rgba(214,180,122,0.075)',
  },

  ticketVisualTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    height: 24,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },

  statusBadgeActive: {
    backgroundColor:
      'rgba(127,191,154,0.08)',
    borderColor:
      'rgba(127,191,154,0.20)',
  },

  statusBadgePast: {
    backgroundColor:
      'rgba(255,255,255,0.035)',
    borderColor:
      'rgba(255,255,255,0.09)',
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  statusDotActive: {
    backgroundColor: colors.success,
  },

  statusDotPast: {
    backgroundColor: '#66615A',
  },


  statusText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },

  statusTextActive: {
    color: colors.success,
  },

  statusTextPast: {
    color: colors.textMuted,
  },


  passNumber: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },

  eventHeroCopy: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 17,
  },


  eventName: {
    color: '#F5F5F2',
    fontSize: 23,
    lineHeight: 27,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.7,
    maxWidth: '90%',
  },

  eventDate: {
    color: 'rgba(214,180,122,0.78)',
    fontSize: 9,
    marginTop: 7,
  },

  ticketVisualBottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 136,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  formatLabel: {
    color: 'rgba(255,255,255,0.18)',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },


  referenceSmall: {
    color: 'rgba(255,255,255,0.20)',
    fontSize: 11,
      },

  /* ---------------------------------------------------------------
     TICKET BODY
  --------------------------------------------------------------- */

  ticketBody: {
    padding: 16,
  },

  ticketInfo: {
    minHeight: 38,
    justifyContent: 'center',
  },


  infoLabel: {
    color: '#53504A',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 4,
  },

  tierName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
  },

  ticketStatus: {
    color: '#8A867E',
    fontSize: 10,
  },

  ticketDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor:
      'rgba(255,255,255,0.065)',
  },

  /* ---------------------------------------------------------------
     QR ROW
  --------------------------------------------------------------- */

  qrRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor:
      'rgba(255,255,255,0.065)',
  },

  qrMini: {
    width: 43,
    height: 43,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EEE7',
  },

  miniQrGrid: {
    width: 27,
    height: 27,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'space-between',
    justifyContent: 'space-between',
  },

  qrBlockLarge: {
    width: 9,
    height: 9,
    backgroundColor: '#101010',
  },

  qrBlockMedium: {
    width: 6,
    height: 6,
    backgroundColor: '#101010',
  },

  qrBlockSmall: {
    width: 4,
    height: 4,
    backgroundColor: '#101010',
  },

  qrCopy: {
    flex: 1,
    marginLeft: 11,
  },

  qrTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },

  qrSubtitle: {
    color: '#5E5A54',
    fontSize: 8,
    marginTop: 3,
  },

  arrowCircle: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      'rgba(255,255,255,0.08)',
  },

  arrow: {
    color: colors.champagne,
    fontSize: 16,
    marginTop: -1,
  },

  /* ---------------------------------------------------------------
     EMPTY
  --------------------------------------------------------------- */

  emptyWrap: {
    alignItems: 'center',
    paddingTop: 35,
    paddingHorizontal: 16,
  },

  emptyVisual: {
    width: 118,
    height: 94,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  emptyRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor:
      'rgba(214,180,122,0.08)',
  },

  emptyTicket: {
    width: 76,
    height: 51,
    borderRadius: 9,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.09)',
    transform: [{ rotate: '-6deg' }],
    padding: 9,
  },

  emptyTicketTop: {
    width: 27,
    height: 4,
    borderRadius: 2,
    backgroundColor:
      'rgba(214,180,122,0.35)',
    marginBottom: 9,
  },

  emptyTicketLine: {
    width: 45,
    height: 4,
    borderRadius: 2,
    backgroundColor:
      'rgba(255,255,255,0.09)',
    marginBottom: 6,
  },

  emptyTicketLineShort: {
    width: 29,
  },


  emptyEyebrow: {
    color: '#625E57',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 8,
  },


  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.3,
    textAlign: 'center',
    maxWidth: 310,
  },

  emptyDescription: {
    color: '#65615B',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 8,
  },

  exploreButton: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#D6B47A',
    marginTop: 20,
  },

  exploreButtonText: {
    color: '#0A0908',
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },

  exploreArrow: {
    color: '#0A0908',
    fontSize: 16,
    marginTop: -1,
  },
});