import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  accountService,
  VolunteerInvitation,
} from '../../services/account';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme';

const STATUS_META: Record<
  VolunteerInvitation['status'],
  {
    label: string;
    color: string;
    background: string;
    border: string;
  }
> = {
  PENDING: {
    label: 'PENDING',
    color: '#D6B47A',
    background: 'rgba(214,180,122,0.08)',
    border: 'rgba(214,180,122,0.20)',
  },
  SENT: {
    label: 'INVITED',
    color: '#9FAFC5',
    background: 'rgba(159,175,197,0.08)',
    border: 'rgba(159,175,197,0.20)',
  },
  ACCEPTED: {
    label: 'ACCEPTED',
    color: '#7FBF9A',
    background: 'rgba(127,191,154,0.08)',
    border: 'rgba(127,191,154,0.20)',
  },
  EXPIRED: {
    label: 'EXPIRED',
    color: colors.textMuted,
    background: 'rgba(119,115,108,0.08)',
    border: 'rgba(119,115,108,0.18)',
  },
  REVOKED: {
    label: 'REVOKED',
    color: '#D96B6B',
    background: 'rgba(217,107,107,0.08)',
    border: 'rgba(217,107,107,0.20)',
  },
};

export default function VolunteerProfileScreen() {
  const {
    session,
    profile,
    roles,
    signOut,
  } = useAuth();

  const insets = useSafeAreaInsets();

  const [invitations, setInvitations] =
    useState<VolunteerInvitation[] | null>(null);

  const [refreshing, setRefreshing] =
    useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);

    try {
      const list =
        await accountService.listMyInvitations();

      setInvitations(list);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const nonAttendeeRoles = roles.filter(
    role => role !== 'ATTENDEE',
  );

  const acceptedCount =
    invitations?.filter(
      invitation =>
        invitation.status === 'ACCEPTED',
    ).length ?? 0;

  const activeCount =
    invitations?.filter(
      invitation =>
        invitation.status === 'ACCEPTED' ||
        invitation.status === 'PENDING' ||
        invitation.status === 'SENT',
    ).length ?? 0;

  const displayName =
    profile?.full_name?.trim() || 'Volunteer';

  const contact =
    session?.user?.email ??
    session?.user?.phone ??
    '—';

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={load}
              tintColor="#D6B47A"
            />
          }
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                Math.max(insets.bottom, 18) + 100,
            },
          ]}
        >
          {/* Header */}

          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>
                STAFF ACCOUNT
              </Text>

              <Text style={styles.headerTitle}>
                Volunteer profile
              </Text>
            </View>

            <View style={styles.accountIndicator}>
              <View style={styles.accountDot} />
            </View>
          </View>

          {/* Identity hero */}

          <View style={styles.identityCard}>
            <View style={styles.identityTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(displayName)}
                </Text>
              </View>

              <View style={styles.identityCopy}>
                <Text
                  style={styles.name}
                  numberOfLines={2}
                >
                  {displayName}
                </Text>

                <Text
                  style={styles.contact}
                  numberOfLines={1}
                >
                  {contact}
                </Text>
              </View>
            </View>

            <View style={styles.identityDivider} />

            <View style={styles.identityFooter}>
              <View>
                <Text style={styles.identityLabel}>
                  ACCESS
                </Text>

                <Text style={styles.identityValue}>
                  {nonAttendeeRoles.length > 0
                    ? nonAttendeeRoles.join(' · ')
                    : 'VOLUNTEER'}
                </Text>
              </View>

              <View style={styles.verifiedBadge}>
                <View style={styles.verifiedDot} />

                <Text style={styles.verifiedText}>
                  STAFF ACCESS
                </Text>
              </View>
            </View>
          </View>

          {/* Assignment overview */}

          <View style={styles.overview}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>
                {activeCount}
              </Text>

              <Text style={styles.overviewLabel}>
                ACTIVE
              </Text>
            </View>

            <View style={styles.overviewDivider} />

            <View style={styles.overviewItem}>
              <Text
                style={[
                  styles.overviewNumber,
                  {
                    color: '#7FBF9A',
                  },
                ]}
              >
                {acceptedCount}
              </Text>

              <Text style={styles.overviewLabel}>
                ACCEPTED
              </Text>
            </View>

            <View style={styles.overviewDivider} />

            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>
                {invitations?.length ?? 0}
              </Text>

              <Text style={styles.overviewLabel}>
                TOTAL
              </Text>
            </View>
          </View>

          {/* Invitations */}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>
                  EVENT ACCESS
                </Text>

                <Text style={styles.sectionTitle}>
                  Assignments
                </Text>
              </View>

              {invitations &&
              invitations.length > 0 ? (
                <Text style={styles.sectionCount}>
                  {invitations.length}
                </Text>
              ) : null}
            </View>

            {invitations === null ? (
              <View style={styles.loadingCard}>
                <View style={styles.loadingDot} />
                <Text style={styles.loadingText}>
                  Loading assignments…
                </Text>
              </View>
            ) : invitations.length === 0 ? (
              <EmptyAssignments />
            ) : (
              invitations.map(inv => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                />
              ))
            )}
          </View>

          {/* Support */}

          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>
              NEED HELP?
            </Text>

            <View style={styles.supportCard}>
              <View style={styles.supportIcon}>
                <Text style={styles.supportIconText}>
                  ?
                </Text>
              </View>

              <View style={styles.supportCopy}>
                <Text style={styles.supportTitle}>
                  Assignment support
                </Text>

                <Text style={styles.supportText}>
                  Questions about your event assignment
                  or gate shift? Contact the event
                  organizer or CtrlPass support.
                </Text>

                <Text style={styles.supportEmail}>
                  support@ctrlpass.in
                </Text>
              </View>
            </View>
          </View>

          {/* Sign out */}

          <Pressable
            onPress={signOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.signOutText}>
              Sign out
            </Text>
          </Pressable>

          <Text style={styles.refreshHint}>
            Pull down anytime to refresh your
            assignments.
          </Text>
        </ScrollView>

        {/* Bottom status */}

        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: Math.max(
                insets.bottom,
                10,
              ),
            },
          ]}
        >
          <View style={styles.bottomLiveDot} />

          <Text style={styles.bottomText}>
            CtrlPass Volunteer Access
          </Text>

          <View style={styles.bottomSpacer} />

          <Text style={styles.bottomVersion}>
            SECURE
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function InvitationCard({
  invitation,
}: {
  invitation: VolunteerInvitation;
}) {
  const meta = STATUS_META[invitation.status];

  const roleLabel = invitation.role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char =>
      char.toUpperCase(),
    );

  const acceptedDate =
    invitation.accepted_at
      ? new Date(
          invitation.accepted_at,
        ).toLocaleDateString()
      : null;

  const expiryDate =
    invitation.expires_at
      ? new Date(
          invitation.expires_at,
        ).toLocaleDateString()
      : null;

  return (
    <View style={styles.invitationCard}>
      <View style={styles.invitationTop}>
        <View style={styles.invitationEventWrap}>
          <View style={styles.eventMark}>
            <View style={styles.eventMarkLine} />
            <View
              style={[
                styles.eventMarkLine,
                styles.eventMarkLineShort,
              ]}
            />
          </View>

          <Text
            style={styles.invitationEvent}
            numberOfLines={2}
          >
            {invitation.event?.name ?? 'Event'}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: meta.background,
              borderColor: meta.border,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: meta.color,
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: meta.color,
              },
            ]}
          >
            {meta.label}
          </Text>
        </View>
      </View>

      <View style={styles.invitationDivider} />

      <View style={styles.invitationMeta}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>
            ROLE
          </Text>

          <Text style={styles.metaValue}>
            {roleLabel}
          </Text>
        </View>

        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>
            INVITED TO
          </Text>

          <Text
            style={styles.metaValue}
            numberOfLines={1}
          >
            {invitation.email}
          </Text>
        </View>
      </View>

      {invitation.status === 'ACCEPTED' &&
      acceptedDate ? (
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>
            ACCEPTED
          </Text>

          <Text style={styles.dateValue}>
            {acceptedDate}
          </Text>
        </View>
      ) : invitation.expires_at ? (
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>
            {invitation.status === 'REVOKED'
              ? 'REVOKED'
              : 'EXPIRES'}
          </Text>

          <Text
            style={[
              styles.dateValue,
              invitation.status ===
                'REVOKED' && {
                color: '#D96B6B',
              },
            ]}
          >
            {expiryDate}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function EmptyAssignments() {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <View style={styles.emptyIconBar} />
        <View
          style={[
            styles.emptyIconBar,
            styles.emptyIconBarShort,
          ]}
        />
      </View>

      <Text style={styles.emptyTitle}>
        No assignments yet
      </Text>

      <Text style={styles.emptyText}>
        When an organizer assigns you to an event,
        the invitation will appear here after you
        sign in with the invited account.
      </Text>
    </View>
  );
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return 'V';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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

  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  /* Header */

  header: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },


  eyebrow: {
    color: '#6D6962',
    fontSize: 11,
    fontWeight: '900',
      },


  headerTitle: {
    color: '#F3F0E9',
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '700',
    letterSpacing: -0.9,
    marginTop: 5,
  },

  accountIndicator: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#10100F',
    borderWidth: 1,
    borderColor: '#24231F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  accountDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7FBF9A',
  },

  /* Identity */

  identityCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#242320',
    borderRadius: 24,
    padding: 17,
  },

  identityTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 59,
    height: 59,
    borderRadius: 20,
    backgroundColor: '#D6B47A',
    alignItems: 'center',
    justifyContent: 'center',
  },


  avatarText: {
    color: '#17120A',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  identityCopy: {
    flex: 1,
    marginLeft: 13,
  },


  name: {
    color: '#F3F0E9',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  contact: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 5,
  },

  identityDivider: {
    height: 1,
    backgroundColor: '#22211E',
    marginVertical: 16,
  },

  identityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  identityLabel: {
    color: '#5E5A54',
    fontSize: 11,
    fontWeight: '800',
      },

  identityValue: {
    color: '#AAA69E',
    fontSize: 10,
    marginTop: 4,
  },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: 'rgba(127,191,154,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(127,191,154,0.18)',
  },

  verifiedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7FBF9A',
    marginRight: 6,
  },


  verifiedText: {
    color: '#7FBF9A',
    fontSize: 11,
    fontWeight: '900',
      },

  /* Overview */

  overview: {
    height: 76,
    borderRadius: 19,
    backgroundColor: '#0D0D0C',
    borderWidth: 1,
    borderColor: '#20201D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginTop: 12,
  },

  overviewItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  overviewNumber: {
    color: '#D6B47A',
    fontSize: 19,
    fontWeight: '700',
  },


  overviewLabel: {
    color: '#5E5A54',
    fontSize: 11,
    fontWeight: '800',
        marginTop: 4,
  },

  overviewDivider: {
    width: 1,
    height: 31,
    backgroundColor: '#24231F',
  },

  /* Sections */

  section: {
    marginTop: 29,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 11,
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

  sectionCount: {
    color: '#8A857D',
    fontSize: 10,
    marginBottom: 2,
  },

  /* Invitation */

  invitationCard: {
    backgroundColor: '#111111',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#242320',
    padding: 15,
    marginBottom: 10,
  },

  invitationTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  invitationEventWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },

  eventMark: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: '#181816',
    borderWidth: 1,
    borderColor: '#282722',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  eventMarkLine: {
    width: 13,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#817B71',
    marginBottom: 4,
  },

  eventMarkLineShort: {
    width: 8,
    marginBottom: 0,
    backgroundColor: '#4E4B45',
  },

  invitationEvent: {
    flex: 1,
    color: '#E8E5DE',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },


  statusText: {
    fontSize: 11,
    fontWeight: '900',
      },

  invitationDivider: {
    height: 1,
    backgroundColor: '#20201D',
    marginVertical: 13,
  },

  invitationMeta: {
    flexDirection: 'row',
  },

  metaBlock: {
    flex: 1,
    paddingRight: 8,
  },


  metaLabel: {
    color: '#5E5A54',
    fontSize: 11,
    fontWeight: '800',
      },

  metaValue: {
    color: '#A7A39B',
    fontSize: 9,
    marginTop: 4,
  },

  dateRow: {
    marginTop: 13,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1A',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },


  dateLabel: {
    color: '#5E5A54',
    fontSize: 11,
    fontWeight: '800',
      },

  dateValue: {
    color: '#7E7971',
    fontSize: 8,
  },

  /* Loading */

  loadingCard: {
    height: 66,
    borderRadius: 18,
    backgroundColor: '#10100F',
    borderWidth: 1,
    borderColor: '#1F1F1C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  loadingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D6B47A',
    marginRight: 9,
  },

  loadingText: {
    color: colors.textMuted,
    fontSize: 10,
  },

  /* Empty */

  emptyCard: {
    borderRadius: 21,
    backgroundColor: '#0D0D0C',
    borderWidth: 1,
    borderColor: '#1E1E1B',
    padding: 23,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#151513',
    borderWidth: 1,
    borderColor: '#252420',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  emptyIconBar: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#6A665F',
    marginBottom: 5,
  },

  emptyIconBarShort: {
    width: 11,
    backgroundColor: '#46433E',
    marginBottom: 0,
  },

  emptyTitle: {
    color: '#D8D4CC',
    fontSize: 15,
    fontWeight: '600',
  },

  emptyText: {
    color: '#69655F',
    fontSize: 9,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 300,
  },

  /* Support */

  supportCard: {
    flexDirection: 'row',
    backgroundColor: '#0D0D0C',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#1F1F1C',
    padding: 15,
  },

  supportIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: '#181816',
    borderWidth: 1,
    borderColor: '#282722',
    alignItems: 'center',
    justifyContent: 'center',
  },

  supportIconText: {
    color: '#8A857D',
    fontSize: 12,
    fontWeight: '700',
  },

  supportCopy: {
    flex: 1,
    marginLeft: 10,
  },

  supportTitle: {
    color: '#BDB9B1',
    fontSize: 11,
    fontWeight: '600',
  },

  supportText: {
    color: '#69655F',
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  supportEmail: {
    color: '#A58A60',
    fontSize: 9,
    marginTop: 7,
  },

  /* Sign out */

  signOutButton: {
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(217,107,107,0.22)',
    backgroundColor: 'rgba(217,107,107,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 29,
  },

  signOutText: {
    color: '#D96B6B',
    fontSize: 11,
    fontWeight: '600',
  },

  refreshHint: {
    color: '#4F4C47',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 11,
  },

  /* Bottom */

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 52,
    backgroundColor: 'rgba(5,5,5,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#171717',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  bottomLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7FBF9A',
    marginRight: 7,
  },

  bottomText: {
    color: '#625E58',
    fontSize: 8,
    fontWeight: '600',
  },

  bottomSpacer: {
    flex: 1,
  },


  bottomVersion: {
    color: '#45423D',
    fontSize: 11,
    fontWeight: '800',
      },

  pressed: {
    opacity: 0.68,
    transform: [{ scale: 0.985 }],
  },
});