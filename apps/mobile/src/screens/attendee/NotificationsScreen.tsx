import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { profileService } from '../../services/profile';
import { SwipeableList } from '../../components/swipeable-list';
import { toast } from '../../components/toast';
import { AppNotification } from '../../types';
import { colors } from '../../theme';
import { formatDateTime } from '../../lib/utils';

type NotificationKind = 'ticket' | 'event' | 'payment' | 'system';

function getNotificationKind(notification: AppNotification): NotificationKind {
  const text = `${notification.title} ${notification.body}`.toLowerCase();

  if (
    text.includes('ticket') ||
    text.includes('booking') ||
    text.includes('qr') ||
    text.includes('pass')
  ) {
    return 'ticket';
  }

  if (
    text.includes('payment') ||
    text.includes('refund') ||
    text.includes('paid') ||
    text.includes('amount')
  ) {
    return 'payment';
  }

  if (
    text.includes('event') ||
    text.includes('venue') ||
    text.includes('schedule') ||
    text.includes('start')
  ) {
    return 'event';
  }

  return 'system';
}

function NotificationMark({
  kind,
  unread,
}: {
  kind: NotificationKind;
  unread: boolean;
}) {
  const symbol =
    kind === 'ticket'
      ? 'T'
      : kind === 'payment'
        ? '₹'
        : kind === 'event'
          ? 'E'
          : '•';

  return (
    <View
      style={[
        styles.notificationMark,
        unread && styles.notificationMarkUnread,
      ]}
    >
      <Text
        style={[
          styles.notificationMarkText,
          unread && styles.notificationMarkTextUnread,
        ]}
      >
        {symbol}
      </Text>
    </View>
  );
}

function NotificationItem({
  item,
  index,
}: {
  item: AppNotification;
  index: number;
}) {
  const unread = !item.read_at;
  const kind = getNotificationKind(item);

  return (
    <View style={styles.item}>
      <View style={styles.timeline}>
        <View
          style={[
            styles.timelineDot,
            unread && styles.timelineDotUnread,
          ]}
        />

        {index !== 0 ? <View style={styles.timelineLine} /> : null}
      </View>

      <View
        style={[
          styles.notificationContent,
          unread && styles.notificationContentUnread,
        ]}
      >
        <View style={styles.itemTop}>
          <NotificationMark kind={kind} unread={unread} />

          <View style={styles.itemHeading}>
            <Text
              style={[
                styles.notificationTitle,
                unread && styles.notificationTitleUnread,
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>

            <Text style={styles.notificationTime}>
              {formatDateTime(item.created_at)}
            </Text>
          </View>

          {unread ? <View style={styles.unreadIndicator} /> : null}
        </View>

        <Text style={styles.notificationBody}>
          {item.body}
        </Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await profileService.listNotifications();
      setNotifications(list);
    } catch {
      // Keep existing data visible if refresh fails.
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

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read_at).length,
    [notifications],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
  }, [load]);

  const markAllRead = useCallback(async () => {
    const unreadIds = notifications
      .filter(notification => !notification.read_at)
      .map(notification => notification.id);

    if (!unreadIds.length || markingRead) {
      return;
    }

    setMarkingRead(true);

    try {
      await profileService.markNotificationsRead(unreadIds);

      const timestamp = new Date().toISOString();

      setNotifications(current =>
        current.map(notification =>
          unreadIds.includes(notification.id)
            ? {
                ...notification,
                read_at: timestamp,
              }
            : notification,
        ),
      );
    } finally {
      setMarkingRead(false);
    }
  }, [markingRead, notifications]);

  const markOneRead = useCallback(async (id: string) => {
    try {
      await profileService.markNotificationsRead([id]);

      setNotifications(current =>
        current.map(notification =>
          notification.id === id
            ? {
                ...notification,
                read_at: new Date().toISOString(),
              }
            : notification,
        ),
      );
    } catch {
      toast.error('Could not mark as read');
    }
  }, []);

  const swipeItems = useMemo(
    () =>
      notifications.map((notification, index) => ({
        id: notification.id,
        content: (
          <NotificationItem
            item={notification}
            index={index}
          />
        ),
        ...(notification.read_at
          ? {}
          : {
              rightActions: [
                {
                  id: 'mark-read',
                  label: 'Mark read',
                  tone: 'primary' as const,
                  icon: ({ size, color }: { size: number; color: string }) => (
                    <Text style={{ color, fontSize: size }}>
                      ✓
                    </Text>
                  ),
                  onPress: (item: { id: string }) => {
                    void markOneRead(item.id);
                  },
                },
              ],
            }),
      })),
    [notifications, markOneRead],
  );

  if (loading) {
    return (
      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top + 24,
          },
        ]}
      >
        <ActivityIndicator color={colors.champagne} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.champagne}
            progressBackgroundColor="#151515"
          />
        }
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 110,
          },
          notifications.length === 0 && styles.emptyContent,
        ]}
      >
      {
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.eyebrow}>CTRL PASS</Text>

                <Text style={styles.headerTitle}>
                  Notifications
                </Text>
              </View>

              {unreadCount > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>
                    {unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.headerBottom}>
              <Text style={styles.headerDescription}>
                Everything important about your events,
                tickets and bookings.
              </Text>

              {unreadCount > 0 ? (
                <Pressable
                  onPress={markAllRead}
                  disabled={markingRead}
                  accessibilityRole="button"
                  accessibilityLabel="Mark all notifications as read"
                  style={({ pressed }) => [
                    styles.readAllButton,
                    pressed && styles.pressed,
                    markingRead && styles.disabled,
                  ]}
                >
                  <Text style={styles.readAllText}>
                    {markingRead ? 'Updating…' : 'Read all'}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {notifications.length > 0 ? (
              <View style={styles.divider} />
            ) : null}
          </View>
        }

        {notifications.length > 0 ? (
          <SwipeableList items={swipeItems} />
        ) : null}

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyOrb}>
              <View style={styles.emptyOrbInner}>
                <Text style={styles.emptyMark}>✓</Text>
              </View>
            </View>

            <Text style={styles.emptyTitle}>
              You’re all caught up.
            </Text>

            <Text style={styles.emptyDescription}>
              Updates about your events, bookings and tickets
              will appear here.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    paddingHorizontal: 20,
  },

  emptyContent: {
    flexGrow: 1,
  },

  pressed: {
    opacity: 0.58,
  },

  disabled: {
    opacity: 0.45,
  },

  /* Header */

  header: {
    marginBottom: 22,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },


  eyebrow: {
    color: colors.champagne,
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 7,
  },


  headerTitle: {
    color: '#F5F5F2',
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '700',
    letterSpacing: -1.15,
  },

  countBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    marginTop: 3,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(214,180,122,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.24)',
  },

  countText: {
    color: colors.champagne,
    fontSize: 12,
    fontWeight: '700',
  },

  headerBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 16,
  },

  headerDescription: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },

  readAllButton: {
    paddingBottom: 2,
  },

  readAllText: {
    color: colors.champagne,
    fontSize: 12,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#202020',
    marginTop: 23,
  },

  /* Notification timeline */

  item: {
    flexDirection: 'row',
    minHeight: 104,
  },

  timeline: {
    width: 25,
    alignItems: 'center',
    position: 'relative',
  },

  timelineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#393939',
    marginTop: 23,
    zIndex: 2,
  },

  timelineDotUnread: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.champagne,
    shadowColor: colors.champagne,
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: 4,
  },

  timelineLine: {
    position: 'absolute',
    top: 31,
    bottom: -1,
    width: 1,
    backgroundColor: '#1C1C1C',
  },

  notificationContent: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 15,
    marginLeft: 4,
    marginBottom: 9,
    borderRadius: 18,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#181818',
  },

  notificationContentUnread: {
    backgroundColor: '#11100D',
    borderColor: 'rgba(214,180,122,0.16)',
  },

  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  notificationMark: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#171717',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  notificationMarkUnread: {
    backgroundColor: 'rgba(214,180,122,0.10)',
  },

  notificationMarkText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },

  notificationMarkTextUnread: {
    color: colors.champagne,
  },

  itemHeading: {
    flex: 1,
    paddingRight: 5,
  },

  notificationTitle: {
    color: '#B9B7B1',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500',
  },

  notificationTitleUnread: {
    color: '#F5F5F2',
    fontWeight: '700',
  },

  notificationTime: {
    color: '#5E5B56',
    fontSize: 10,
    marginTop: 4,
  },

  unreadIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.champagne,
    marginTop: 5,
  },

  notificationBody: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    paddingLeft: 45,
  },

  /* Empty state */

  emptyState: {
    flex: 1,
    minHeight: 430,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
  },

  emptyOrb: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(214,180,122,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyOrbInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyMark: {
    color: colors.champagne,
    fontSize: 20,
    fontWeight: '600',
  },


  emptyTitle: {
    color: '#F5F5F2',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginTop: 22,
    textAlign: 'center',
  },

  emptyDescription: {
    color: '#6E6B65',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
});