import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EmptyState,
  LoadingState,
} from '../../components';
import {
  accountService,
  ReferralSummary,
} from '../../services/account';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme';

export default function ReferralsScreen() {
  const insets = useSafeAreaInsets();
  const { configured } = useAuth();

  const [data, setData] =
    useState<ReferralSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const summary =
          await accountService.getReferralSummary();

        setData(summary);

        if (!summary) {
          setError(
            'Referral service is not available right now.',
          );
        }
      } catch (e: any) {
        setError(
          e?.message ??
            'Could not load referrals.',
        );
        setData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  async function share() {
    if (!data?.code || sharing) return;

    setSharing(true);

    try {
      await Share.share({
        message: `Book events on CtrlPass with my referral code ${data.code}: https://ctrlpass.in/r/${data.code}`,
      });
    } catch {
      // User cancelled the share sheet.
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <LoadingState message="Loading your referrals..." />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.loadingScreen}>
        <EmptyState
          title="Referrals unavailable"
          description={
            error ?? 'Try again later.'
          }
          actionLabel="Retry"
          onAction={() => load()}
        />
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
            onRefresh={() => load(true)}
            tintColor={colors.champagne}
          />
        }
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 45,
          },
        ]}
      >
        {/* Header */}

        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            REFERRAL PROGRAM
          </Text>

          <Text style={styles.title}>
            Bring your people.{'\n'}
            Share the experience.
          </Text>

          <Text style={styles.subtitle}>
            Invite friends to CtrlPass using your personal
            referral code.
          </Text>
        </View>

        {/* Referral code hero */}

        <View style={styles.codeHero}>
          <View style={styles.codeHeroTop}>
            <View>
              <Text style={styles.codeEyebrow}>
                YOUR CODE
              </Text>

              <Text style={styles.code}>
                {data.code}
              </Text>
            </View>

            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>
                CTRL
              </Text>
            </View>
          </View>

          <View style={styles.codeDivider} />

          <Text style={styles.shareHint}>
            Share your code with friends and let them
            enter it after creating their CtrlPass account.
          </Text>

          <Pressable
            onPress={share}
            disabled={sharing}
            accessibilityRole="button"
            accessibilityLabel="Share referral code"
            style={({ pressed }) => [
              styles.shareButton,
              pressed && styles.sharePressed,
              sharing && styles.shareDisabled,
            ]}
          >
            <Text style={styles.shareIcon}>
              ↗
            </Text>

            <Text style={styles.shareText}>
              {sharing
                ? 'Opening share…'
                : 'Share with friends'}
            </Text>
          </Pressable>
        </View>

        {/* Stats */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              YOUR ACTIVITY
            </Text>
          </View>

          <View style={styles.stats}>
            <Stat
              value={data.successful}
              label="Successful referrals"
              accent
            />

            <View style={styles.statDivider} />

            <Stat
              value={data.pending}
              label="Pending rewards"
            />
          </View>
        </View>

        {/* How it works */}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            HOW IT WORKS
          </Text>

          <View style={styles.steps}>
            <Step
              number="01"
              title="Share your code"
              description="Send your personal CtrlPass code to friends."
            />

            <Step
              number="02"
              title="They join CtrlPass"
              description="Your friend enters the code after creating their account."
            />

            <Step
              number="03"
              title="Referral is recorded"
              description="Once their account is active, the referral appears in your activity."
              last
            />
          </View>
        </View>

        {/* Programme note */}

        <View style={styles.note}>
          <View style={styles.noteIcon}>
            <Text style={styles.noteIconText}>
              i
            </Text>
          </View>

          <View style={styles.noteCopy}>
            <Text style={styles.noteTitle}>
              About referral rewards
            </Text>

            <Text style={styles.noteText}>
              Referral rewards, when a programme is active
              for your account, are credited by CtrlPass
              and shown here. This screen displays only
              real referral records from your account.
            </Text>

            {!configured ? (
              <Text style={styles.configurationText}>
                Backend not configured — set Supabase env
                to enable referrals.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text
        style={[
          styles.statValue,
          accent && styles.statValueAccent,
        ]}
      >
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function Step({
  number,
  title,
  description,
  last,
}: {
  number: string;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.step,
        last && styles.stepLast,
      ]}
    >
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>
          {number}
        </Text>
      </View>

      <View style={styles.stepCopy}>
        <Text style={styles.stepTitle}>
          {title}
        </Text>

        <Text style={styles.stepDescription}>
          {description}
        </Text>
      </View>
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

  content: {
    paddingHorizontal: 20,
  },

  /* Header */

  header: {
    paddingTop: 8,
    marginBottom: 27,
  },


  eyebrow: {
    color: colors.champagne,
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 11,
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
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    maxWidth: 340,
  },

  /* Code hero */

  codeHero: {
    backgroundColor: '#101010',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 19,
    marginBottom: 29,
  },

  codeHeroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },


  codeEyebrow: {
    color: '#68645E',
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 8,
  },


  code: {
    color: '#F2EFE8',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: 4,
  },

  codeBadge: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: '#181715',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },


  codeBadgeText: {
    color: colors.champagne,
    fontSize: 11,
    fontWeight: '800',
      },

  codeDivider: {
    height: 1,
    backgroundColor: '#252525',
    marginTop: 20,
    marginBottom: 13,
  },

  shareHint: {
    color: '#6C6862',
    fontSize: 10,
    lineHeight: 16,
    marginBottom: 16,
  },

  shareButton: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: colors.champagne,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 18,
  },

  sharePressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },

  shareDisabled: {
    opacity: 0.55,
  },

  shareIcon: {
    color: '#0A0908',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 8,
  },

  shareText: {
    color: '#0A0908',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Sections */

  section: {
    marginBottom: 29,
  },

  sectionHeader: {
    marginBottom: 11,
  },


  sectionLabel: {
    color: '#5F5C57',
    fontSize: 11,
    fontWeight: '700',
      },

  /* Stats */

  stats: {
    minHeight: 105,
    backgroundColor: '#101010',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#202020',
    flexDirection: 'row',
    alignItems: 'center',
  },

  stat: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  statDivider: {
    width: 1,
    height: 47,
    backgroundColor: '#292929',
  },


  statValue: {
    color: '#D8D5CE',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
  },

  statValueAccent: {
    color: colors.champagne,
  },

  statLabel: {
    color: '#66625C',
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
    marginTop: 5,
  },

  /* Steps */

  steps: {
    borderTopWidth: 1,
    borderColor: '#1D1D1D',
  },

  step: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#1D1D1D',
  },

  stepLast: {
    borderBottomWidth: 0,
  },

  stepNumber: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepNumberText: {
    color: colors.champagne,
    fontSize: 8,
    fontWeight: '700',
  },

  stepCopy: {
    flex: 1,
    marginLeft: 13,
    paddingRight: 4,
  },

  stepTitle: {
    color: '#DCD9D2',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },

  stepDescription: {
    color: '#68645E',
    fontSize: 10,
    lineHeight: 16,
  },

  /* Note */

  note: {
    flexDirection: 'row',
    backgroundColor: '#0D0D0D',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    padding: 14,
  },

  noteIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2B2B2B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  noteIconText: {
    color: '#9B978F',
    fontSize: 11,
    fontWeight: '700',
  },

  noteCopy: {
    flex: 1,
    marginLeft: 11,
  },

  noteTitle: {
    color: '#C8C5BE',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 5,
  },

  noteText: {
    color: '#625F59',
    fontSize: 10,
    lineHeight: 16,
  },

  configurationText: {
    color: '#827B70',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 8,
  },
});