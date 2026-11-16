import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AnimatedBadge } from '../../components/animated-badge';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '../../components';
import { organizerService } from '../../services/organizer';
import { Event } from '../../types';
import {
  VolunteerStackParamList,
  RootStackParamList,
} from '../../navigation/types';
import { formatDateTime } from '../../lib/utils';
import { colors } from '../../theme';

export default function VolunteerHomeScreen() {
  const nav =
    useNavigation<
      NativeStackNavigationProp<VolunteerStackParamList>
    >();

  const rootNav =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList>
    >();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const memberships =
        await organizerService.volunteerEvents();

      setEvents(
        memberships
          .map((membership: { event: Event }) => membership.event)
          .filter(Boolean),
      );
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const renderAssignment = useCallback(
    ({ item }: { item: Event }) => (
      <EventAssignmentCard
        event={item}
        onScan={() =>
          nav.navigate('QRScanner', {
            eventId: item.id,
          })
        }
      />
    ),
    [nav],
  );

  if (loading) {
    return (
      <LoadingState message="Connecting to check-in gates..." />
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <View style={styles.screen}>
        {/* Header */}

        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />

              <Text style={styles.liveText}>
                OPERATIONS
              </Text>
            </View>

            <Text style={styles.title}>
              Check-in desk
            </Text>

            <Text style={styles.subtitle}>
              Choose an assigned event to open its
              verification gate.
            </Text>
          </View>

          <Pressable
            onPress={() =>
              nav.navigate('VolunteerProfile')
            }
            accessibilityRole="button"
            accessibilityLabel="Open volunteer account"
            style={({ pressed }) => [
              styles.profileButton,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.profileHead} />
            <View style={styles.profileBody} />
          </Pressable>
        </View>

        {/* Quick status */}

        <View style={styles.statusStrip}>
          <View style={styles.statusItem}>
            <View style={styles.statusIndicator} />

            <View>
              <Text style={styles.statusLabel}>
                GATE STATUS
              </Text>

              <Text style={styles.statusValue}>
                Ready
              </Text>
            </View>
          </View>

          <View style={styles.statusDivider} />

          <View style={styles.statusItem}>
            <Text style={styles.eventCount}>
              {events.length}
            </Text>

            <View>
              <Text style={styles.statusLabel}>
                ASSIGNED
              </Text>

              <Text style={styles.statusValue}>
                {events.length === 1
                  ? 'Event'
                  : 'Events'}
              </Text>
            </View>
          </View>
        </View>

        {/* Events */}

        <FlatList
          data={events}
          keyExtractor={event => event.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            events.length === 0 &&
              styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={load}
              tintColor="#D6B47A"
            />
          }
          ListHeaderComponent={
            events.length > 0 ? (
              <View style={styles.listHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>
                    YOUR ASSIGNMENTS
                  </Text>

                  <Text style={styles.sectionTitle}>
                    Active gate desks
                  </Text>
                </View>

                <View style={styles.liveBadge}>
                  <AnimatedBadge status="success" pulse size="sm">
                    LIVE
                  </AnimatedBadge>
                </View>
              </View>
            ) : null
          }
          renderItem={renderAssignment}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <View style={styles.emptyIcon}>
                <View style={styles.emptyIconTop} />
                <View style={styles.emptyIconBottom} />
              </View>

              <Text style={styles.emptyEyebrow}>
                No assignments
              </Text>

              <Text style={styles.emptyTitle}>
                No gate desks yet
              </Text>

              <Text style={styles.emptyDescription}>
                Events assigned to your volunteer
                account will appear here.
              </Text>

              <View style={styles.emptyHint}>
                <Text style={styles.emptyHintText}>
                  Ask the event organizer to assign
                  your account as a gate scanner.
                </Text>
              </View>
            </View>
          }
        />

        {/* Bottom switch */}

        <View style={styles.bottomBar}>
          <Pressable
            onPress={() =>
              nav.navigate('VolunteerProfile')
            }
            style={({ pressed }) => [
              styles.bottomAction,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.bottomActionText}>
              Account
            </Text>
          </Pressable>

          <View style={styles.bottomDivider} />

          <Pressable
            onPress={() =>
              rootNav.navigate(
                'Attendee',
                {
                  screen: 'AttendeeTabs',
                } as never,
              )
            }
            style={({ pressed }) => [
              styles.bottomAction,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.bottomSwitchText}>
              Switch to attendee
            </Text>

            <Text style={styles.bottomArrow}>
              →
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function EventAssignmentCard({
  event,
  onScan,
}: {
  event: Event;
  onScan: () => void;
}) {
  const venueName = event.venue?.name;
  const venueCity = event.venue?.city;

  return (
    <View style={styles.eventCard}>
      {/* Card top */}

      <View style={styles.cardTop}>
        <View style={styles.assignmentBadge}>
          <View style={styles.assignmentDot} />

          <Text style={styles.assignmentText}>
            GATE SCANNER
          </Text>
        </View>

        <View style={styles.secureBadge}>
          <Text style={styles.secureBadgeText}>
            VERIFIED
          </Text>
        </View>
      </View>

      {/* Event */}

      <Text
        style={styles.eventName}
        numberOfLines={2}
      >
        {event.name}
      </Text>

      {/* Date */}

      <View style={styles.eventMeta}>
        <View style={styles.metaIcon}>
          <View style={styles.calendarTop} />
          <View style={styles.calendarBody} />
        </View>

        <View style={styles.metaCopy}>
          <Text style={styles.metaLabel}>
            EVENT TIME
          </Text>

          <Text style={styles.metaValue}>
            {formatDateTime(event.start_at)}
          </Text>
        </View>
      </View>

      {/* Venue */}

      {venueName || venueCity ? (
        <View style={styles.eventMeta}>
          <View style={styles.metaIcon}>
            <View style={styles.locationDot} />
          </View>

          <View style={styles.metaCopy}>
            <Text style={styles.metaLabel}>
              VENUE
            </Text>

            <Text
              style={styles.metaValue}
              numberOfLines={1}
            >
              {[venueName, venueCity]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Divider */}

      <View style={styles.cardDivider} />

      {/* Scanner action */}

      <Pressable
        onPress={onScan}
        accessibilityRole="button"
        accessibilityLabel={`Launch QR scanner for ${event.name}`}
        style={({ pressed }) => [
          styles.scanButton,
          pressed && styles.scanButtonPressed,
        ]}
      >
        <View style={styles.scanIcon}>
          <View style={styles.scanCornerTL} />
          <View style={styles.scanCornerBR} />
        </View>

        <View style={styles.scanButtonCopy}>
          <Text style={styles.scanButtonTitle}>
            Open gate scanner
          </Text>

          <Text style={styles.scanButtonSubtitle}>
            Verify attendee QR passes
          </Text>
        </View>

        <Text style={styles.scanArrow}>
          →
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },

  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  /* ───────── Header ───────── */

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },

  headerCopy: {
    flex: 1,
    paddingRight: 16,
  },

  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7FBF9A',
    marginRight: 7,
  },


  liveText: {
    color: '#817C73',
    fontSize: 11,
    fontWeight: '800',
      },


  title: {
    color: '#F5F5F2',
    fontSize: 31,
    lineHeight: 35,
    fontWeight: '700',
    letterSpacing: -1.1,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 290,
  },

  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#252420',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A7A39B',
    position: 'absolute',
    top: 10,
  },

  profileBody: {
    width: 16,
    height: 8,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    backgroundColor: '#A7A39B',
    position: 'absolute',
    bottom: 9,
  },

  /* ───────── Status strip ───────── */

  statusStrip: {
    marginHorizontal: 20,
    minHeight: 66,
    borderRadius: 18,
    backgroundColor: '#0D0D0C',
    borderWidth: 1,
    borderColor: '#20201D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 26,
  },

  statusItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7FBF9A',
    marginRight: 10,
  },


  statusLabel: {
    color: '#5E5A54',
    fontSize: 11,
    fontWeight: '800',
      },

  statusValue: {
    color: '#BDB9B1',
    fontSize: 10,
    marginTop: 3,
  },

  eventCount: {
    color: '#D6B47A',
    fontSize: 20,
    fontWeight: '700',
    marginRight: 9,
  },

  statusDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#24231F',
    marginHorizontal: 13,
  },

  /* ───────── List ───────── */

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 105,
  },

  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },


  sectionEyebrow: {
    color: '#625E58',
    fontSize: 11,
    fontWeight: '800',
      },

  sectionTitle: {
    color: '#E7E4DD',
    fontSize: 17,
    fontWeight: '600',
    marginTop: 4,
  },

  liveBadge: {
    height: 25,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: 'rgba(127,191,154,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(127,191,154,0.20)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  liveBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7FBF9A',
    marginRight: 5,
  },


  liveBadgeText: {
    color: '#7FBF9A',
    fontSize: 11,
    fontWeight: '900',
      },

  /* ───────── Event card ───────── */

  eventCard: {
    backgroundColor: '#111111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#242320',
    padding: 17,
    marginBottom: 14,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  assignmentBadge: {
    height: 25,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: 'rgba(127,191,154,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(127,191,154,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  assignmentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7FBF9A',
    marginRight: 6,
  },


  assignmentText: {
    color: '#7FBF9A',
    fontSize: 11,
    fontWeight: '900',
      },

  secureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },


  secureBadgeText: {
    color: '#595650',
    fontSize: 11,
    fontWeight: '800',
      },


  eventName: {
    color: '#F1EEE7',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 16,
    marginBottom: 17,
  },

  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  metaIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: '#181816',
    borderWidth: 1,
    borderColor: '#252420',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  calendarTop: {
    width: 12,
    height: 3,
    borderRadius: 1,
    backgroundColor: '#8C877E',
    position: 'absolute',
    top: 9,
  },

  calendarBody: {
    width: 13,
    height: 10,
    borderWidth: 1,
    borderColor: '#8C877E',
    borderRadius: 2,
    position: 'absolute',
    bottom: 8,
  },

  locationDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#8C877E',
  },

  metaCopy: {
    flex: 1,
  },


  metaLabel: {
    color: '#5F5B55',
    fontSize: 11,
    fontWeight: '800',
      },

  metaValue: {
    color: '#AAA69E',
    fontSize: 10,
    marginTop: 3,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#22211E',
    marginTop: 4,
    marginBottom: 13,
  },

  /* ───────── Scanner button ───────── */

  scanButton: {
    minHeight: 59,
    borderRadius: 16,
    backgroundColor: '#E8E3D9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  scanButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },

  scanIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#D6B47A',
    position: 'relative',
  },

  scanCornerTL: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#17120A',
    top: 8,
    left: 8,
  },

  scanCornerBR: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#17120A',
    bottom: 8,
    right: 8,
  },

  scanButtonCopy: {
    flex: 1,
    marginLeft: 10,
  },

  scanButtonTitle: {
    color: '#090909',
    fontSize: 12,
    fontWeight: '800',
  },

  scanButtonSubtitle: {
    color: '#625D54',
    fontSize: 8,
    marginTop: 3,
  },

  scanArrow: {
    color: '#090909',
    fontSize: 20,
    marginLeft: 8,
  },

  /* ───────── Empty ───────── */

  emptyWrapper: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 45,
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#10100F',
    borderWidth: 1,
    borderColor: '#24231F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  emptyIconTop: {
    width: 21,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#6A665F',
    marginBottom: 5,
  },

  emptyIconBottom: {
    width: 15,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#46433E',
  },


  emptyEyebrow: {
    color: '#9E7B48',
    fontSize: 11,
    fontWeight: '900',
      },


  emptyTitle: {
    color: '#F0EDE6',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginTop: 8,
  },

  emptyDescription: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 290,
  },

  emptyHint: {
    marginTop: 18,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0D0D0C',
    borderWidth: 1,
    borderColor: '#1E1E1B',
  },

  emptyHintText: {
    color: '#5E5A54',
    fontSize: 8,
    textAlign: 'center',
  },

  /* ───────── Bottom ───────── */

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 62,
    backgroundColor: 'rgba(5,5,5,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#171717',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomAction: {
    height: 42,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomActionText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },

  bottomSwitchText: {
    color: '#A7A39B',
    fontSize: 10,
    fontWeight: '600',
  },

  bottomArrow: {
    color: '#D6B47A',
    fontSize: 16,
    marginLeft: 7,
  },

  bottomDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#252420',
  },

  pressed: {
    opacity: 0.68,
  },
});