import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingSkeleton } from '../../components';
import { bookingService } from '../../services/bookings';
import { Booking } from '../../types';
import { toast } from '../../components/toast';
import { AttendeeStackParamList } from '../../navigation/types';
import {
  colors,
} from '../../theme';
import {
  formatDateTime,
  formatPaiseCompact,
} from '../../lib/utils';

type Filter = 'ALL' | 'CONFIRMED' | 'OTHER';

type BadgeTone =
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral';

function statusTone(status: string): BadgeTone {
  switch (status) {
    case 'CONFIRMED':
      return 'success';

    case 'RESERVED':
    case 'PAYMENT_PENDING':
      return 'warning';

    case 'CANCELLED':
    case 'FAILED':
      return 'error';

    default:
      return 'neutral';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'Confirmed';

    case 'RESERVED':
      return 'Reserved';

    case 'PAYMENT_PENDING':
      return 'Payment pending';

    case 'CANCELLED':
      return 'Cancelled';

    case 'FAILED':
      return 'Failed';

    default:
      return status.replace(/_/g, ' ');
  }
}

function statusColor(tone: BadgeTone) {
  switch (tone) {
    case 'success':
      return colors.success;

    case 'warning':
      return colors.champagne;

    case 'error':
      return colors.error;

    default:
      return '#8A877F';
  }
}

export default function BookingsScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AttendeeStackParamList>
    >();

  const insets = useSafeAreaInsets();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('ALL');

  const load = useCallback(async (options?: { silent?: boolean }) => {
    try {
      const list =
        await bookingService.listMyBookings();

      setBookings(list);
    } catch (error) {
      if (options?.silent) {
        // Initial load keeps its own error state below.
        return;
      }
      throw error;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
      toast.success('Bookings updated');
    } catch {
      toast.error('Could not refresh your bookings');
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const filteredBookings = useMemo(() => {
    if (filter === 'CONFIRMED') {
      return bookings.filter(
        booking => booking.status === 'CONFIRMED',
      );
    }

    if (filter === 'OTHER') {
      return bookings.filter(
        booking => booking.status !== 'CONFIRMED',
      );
    }

    return bookings;
  }, [bookings, filter]);

  const confirmedCount = useMemo(
    () =>
      bookings.filter(
        booking => booking.status === 'CONFIRMED',
      ).length,
    [bookings],
  );

  const renderBooking = useCallback(
    ({ item }: { item: Booking }) => (
      <BookingRow
        booking={item}
        onPress={() =>
          navigation.navigate('BookingStatus', {
            bookingId: item.id,
          })
        }
      />
    ),
    [navigation],
  );

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <LoadingSkeleton label="Orders" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredBookings}
        keyExtractor={booking => booking.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + 14,
            paddingBottom: insets.bottom + 110,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.champagne}
            progressBackgroundColor="#151515"
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>
                YOUR ACTIVITY
              </Text>

              <Text style={styles.title}>
                Order history
              </Text>

              <Text style={styles.subtitle}>
                Every booking, payment and event pass
                in one place.
              </Text>
            </View>

            <View style={styles.summary}>
              <View style={styles.summaryMain}>
                <Text style={styles.summaryNumber}>
                  {bookings.length}
                </Text>

                <Text style={styles.summaryLabel}>
                  TOTAL ORDERS
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summarySecondary}>
                <Text style={styles.summaryNumberSmall}>
                  {confirmedCount}
                </Text>

                <Text style={styles.summaryLabel}>
                  CONFIRMED
                </Text>
              </View>
            </View>

            <View style={styles.filterRow}>
              <FilterButton
                label="All"
                active={filter === 'ALL'}
                onPress={() => setFilter('ALL')}
              />

              <FilterButton
                label="Confirmed"
                active={filter === 'CONFIRMED'}
                onPress={() =>
                  setFilter('CONFIRMED')
                }
              />

              <FilterButton
                label="Other"
                active={filter === 'OTHER'}
                onPress={() =>
                  setFilter('OTHER')
                }
              />
            </View>

            {filteredBookings.length > 0 ? (
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>
                  BOOKINGS
                </Text>

                <Text style={styles.sectionCount}>
                  {filteredBookings.length}
                </Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={renderBooking}
        ListEmptyComponent={
          <EmptyOrders hasBookings={bookings.length > 0} />
        }
      />
    </View>
  );
}

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.filterButton,
        active && styles.filterButtonActive,
        pressed && styles.filterButtonPressed,
      ]}
    >
      <Text
        style={[
          styles.filterText,
          active && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function BookingRow({
  booking,
  onPress,
}: {
  booking: Booking;
  onPress: () => void;
}) {
  const tone = statusTone(booking.status);
  const toneColor = statusColor(tone);

  const ticketLabel =
    booking.ticket_count === 1
      ? '1 ticket'
      : `${booking.ticket_count} tickets`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order ${booking.booking_reference}`}
      style={({ pressed }) => [
        styles.booking,
        pressed && styles.bookingPressed,
      ]}
    >
      {/* Top rule / status */}
      <View style={styles.bookingTop}>
        <View style={styles.referenceWrap}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: toneColor,
              },
            ]}
          />

          <Text style={styles.reference}>
            {booking.booking_reference}
          </Text>
        </View>

        <View
          style={[
            styles.status,
            {
              borderColor: `${toneColor}35`,
              backgroundColor: `${toneColor}0D`,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: toneColor,
              },
            ]}
          >
            {statusLabel(booking.status)}
          </Text>
        </View>
      </View>

      {/* Event */}
      <Text
        style={styles.eventName}
        numberOfLines={2}
      >
        {booking.event?.name ?? 'Event Admission'}
      </Text>

      {/* Details */}
      <View style={styles.details}>
        <Detail
          label="BOOKED"
          value={formatDateTime(booking.created_at)}
        />

        <View style={styles.detailDivider} />

        <Detail
          label="PASSES"
          value={ticketLabel}
        />

        <View style={styles.detailDivider} />

        <View style={styles.totalBlock}>
          <Text style={styles.detailLabel}>
            TOTAL
          </Text>

          <Text style={styles.total}>
            {formatPaiseCompact(
              booking.total_amount_minor,
            )}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.bookingFooter}>
        <Text style={styles.viewOrder}>
          View order
        </Text>

        <View style={styles.arrowCircle}>
          <Text style={styles.arrow}>›</Text>
        </View>
      </View>
    </Pressable>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text
        style={styles.detailValue}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function EmptyOrders({
  hasBookings,
}: {
  hasBookings: boolean;
}) {
  if (hasBookings) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyMark}>
          <Text style={styles.emptyMarkText}>
            —
          </Text>
        </View>

        <Text style={styles.emptyTitle}>
          Nothing in this view
        </Text>

        <Text style={styles.emptyText}>
          Try another order filter to see your
          booking history.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.empty}>
      <View style={styles.emptyMark}>
        <Text style={styles.emptyMarkText}>
          +
        </Text>
      </View>

      <Text style={styles.emptyTitle}>
        Your story starts here
      </Text>

      <Text style={styles.emptyText}>
        Once you book an event, your orders will
        appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  listContent: {
    paddingHorizontal: 20,
  },

  /* Header */

  header: {
    paddingTop: 8,
    marginBottom: 24,
  },


  eyebrow: {
    color: colors.champagne,
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 10,
  },


  title: {
    color: '#F5F5F2',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -1.15,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 340,
  },

  /* Summary */

  summary: {
    minHeight: 92,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1D1D1D',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  summaryMain: {
    flex: 1,
  },

  summarySecondary: {
    width: 105,
  },


  summaryNumber: {
    color: '#F5F5F2',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -1,
  },


  summaryNumberSmall: {
    color: colors.champagne,
    fontSize: 24,
    lineHeight: 27,
    fontWeight: '700',
    letterSpacing: -0.8,
  },


  summaryLabel: {
    color: '#5F5C57',
    fontSize: 11,
    fontWeight: '700',
        marginTop: 5,
  },

  summaryDivider: {
    width: 1,
    height: 42,
    backgroundColor: '#242424',
    marginRight: 22,
  },

  /* Filters */

  filterRow: {
    flexDirection: 'row',
    marginBottom: 26,
  },

  filterButton: {
    minHeight: 36,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242424',
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  filterButtonActive: {
    backgroundColor: '#E8E6DE',
    borderColor: '#E8E6DE',
  },

  filterButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  filterText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  filterTextActive: {
    color: '#080808',
  },

  /* Section */

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },


  sectionTitle: {
    color: '#65615B',
    fontSize: 11,
    fontWeight: '700',
      },

  sectionCount: {
    color: '#4D4A45',
    fontSize: 10,
    marginLeft: 7,
  },

  /* Booking */

  booking: {
    backgroundColor: '#111111',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#202020',
    padding: 17,
    marginBottom: 12,
  },

  bookingPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },

  bookingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  referenceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },


  reference: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
      },

  status: {
    minHeight: 25,
    paddingHorizontal: 9,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    marginLeft: 10,
  },


  statusText: {
    fontSize: 11,
    fontWeight: '700',
      },


  eventName: {
    color: '#F1F0EB',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.45,
    marginBottom: 19,
  },

  /* Details */

  details: {
    minHeight: 57,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#292929',
    flexDirection: 'row',
    alignItems: 'center',
  },

  detail: {
    flex: 1,
    minWidth: 0,
  },


  detailLabel: {
    color: '#5F5C57',
    fontSize: 11,
    fontWeight: '700',
      },

  detailValue: {
    color: '#B8B5AE',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  detailDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#292929',
    marginHorizontal: 10,
  },

  totalBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },

  total: {
    color: colors.champagne,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },

  /* Footer */

  bookingFooter: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
  },

  viewOrder: {
    color: '#8B8881',
    fontSize: 11,
    fontWeight: '600',
  },

  arrowCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#1B1B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow: {
    color: '#B8B5AE',
    fontSize: 20,
    lineHeight: 22,
    marginTop: -2,
  },

  /* Empty */

  empty: {
    alignItems: 'center',
    paddingTop: 58,
    paddingHorizontal: 35,
  },

  emptyMark: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#292929',
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  emptyMarkText: {
    color: colors.champagne,
    fontSize: 24,
    fontWeight: '300',
  },


  emptyTitle: {
    color: '#E7E5DF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },

  emptyText: {
    color: '#66625C',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
});