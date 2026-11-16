import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingState } from '../../components';
import { Switch } from '../../components/switch';
import { toast } from '../../components/toast';
import {
  accountService,
  UserSettings,
} from '../../services/account';
import { colors } from '../../theme';

const OPTIONS: {
  key: keyof UserSettings;
  title: string;
  description: string;
  eyebrow: string;
}[] = [
  {
    key: 'booking_updates',
    eyebrow: 'ESSENTIAL',
    title: 'Booking & payment',
    description:
      'Confirmations, payment status and ticket issuance for your bookings.',
  },
  {
    key: 'event_reminders',
    eyebrow: 'EVENTS',
    title: 'Event reminders',
    description:
      'Useful reminders before events you already have tickets for.',
  },
  {
    key: 'promotions',
    eyebrow: 'OPTIONAL',
    title: 'News & offers',
    description:
      'Occasional updates about new events and CtrlPass features.',
  },
];

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();

  const [settings, setSettings] =
    useState<UserSettings | null>(null);

  const [saving, setSaving] = useState<
    keyof UserSettings | null
  >(null);

  useEffect(() => {
    accountService
      .getSettings()
      .then(setSettings)
      .catch(() => {
        toast.error('Could not load preferences', {
          description: 'Try again later.',
        });
      });
  }, []);

  async function toggle(
    key: keyof UserSettings,
    value: boolean,
  ) {
    if (!settings || saving) return;

    const previous = settings;

    const next = {
      ...settings,
      [key]: value,
    } as UserSettings;

    setSettings(next);
    setSaving(key);

    try {
      await accountService.saveSettings(next);
    } catch (e: any) {
      setSettings(previous);

      toast.error('Could not save', {
        description: e?.message ?? 'Try again.',
      });
    } finally {
      setSaving(null);
    }
  }

  if (!settings) {
    return (
      <View style={styles.loadingScreen}>
        <LoadingState message="Loading preferences..." />
      </View>
    );
  }

  const enabledCount = OPTIONS.filter(
    option => Boolean(settings[option.key]),
  ).length;

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        {/* Header */}

        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            YOUR PREFERENCES
          </Text>

          <Text style={styles.title}>
            Stay in the loop.{'\n'}
            On your terms.
          </Text>

          <Text style={styles.subtitle}>
            Choose which notifications CtrlPass can send
            you. Essential booking communication stays
            separate from optional updates.
          </Text>
        </View>

        {/* Summary */}

        <View style={styles.summary}>
          <View style={styles.summaryIndicator}>
            <View style={styles.summaryDot} />
          </View>

          <View style={styles.summaryCopy}>
            <Text style={styles.summaryTitle}>
              {enabledCount === 0
                ? 'Notifications are quiet'
                : `${enabledCount} preference${
                    enabledCount === 1 ? '' : 's'
                  } enabled`}
            </Text>

            <Text style={styles.summaryText}>
              You can change these settings anytime.
            </Text>
          </View>
        </View>

        {/* Preferences */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            NOTIFICATION TYPES
          </Text>
        </View>

        <View style={styles.options}>
          {OPTIONS.map(
            ({
              key,
              eyebrow,
              title,
              description,
            }) => {
              const enabled = Boolean(
                settings[key],
              );

              const isSaving = saving === key;

              return (
                <PreferenceRow
                  key={String(key)}
                  eyebrow={eyebrow}
                  title={title}
                  description={description}
                  enabled={enabled}
                  saving={isSaving}
                  onToggle={value =>
                    toggle(key, value)
                  }
                />
              );
            },
          )}
        </View>

        {/* Footer */}

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>
            A note about essential updates
          </Text>

          <Text style={styles.footerText}>
            Booking confirmations, payment outcomes and
            ticket issuance are important to your
            transactions. Promotional messages are
            completely optional.
          </Text>
        </View>
      </View>
    </View>
  );
}

function PreferenceRow({
  eyebrow,
  title,
  description,
  enabled,
  saving,
  onToggle,
}: {
  eyebrow: string;
  title: string;
  description: string;
  enabled: boolean;
  saving: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <View
      style={[
        styles.preference,
        enabled && styles.preferenceEnabled,
      ]}
    >
      <View style={styles.preferenceTop}>
        <View style={styles.preferenceTitleWrap}>
          <Text
            style={[
              styles.preferenceEyebrow,
              enabled &&
                styles.preferenceEyebrowEnabled,
            ]}
          >
            {eyebrow}
          </Text>

          <Text style={styles.preferenceTitle}>
            {title}
          </Text>
        </View>

        <Switch
          checked={enabled}
          onCheckedChange={() => onToggle(!enabled)}
          disabled={saving}
          accessibilityLabel={title}
        />
      </View>

      <Text style={styles.preferenceDescription}>
        {description}
      </Text>

      <View style={styles.preferenceFooter}>
        <View
          style={[
            styles.stateDot,
            enabled
              ? styles.stateDotOn
              : styles.stateDotOff,
          ]}
        />

        <Text
          style={[
            styles.stateText,
            enabled && styles.stateTextOn,
          ]}
        >
          {saving
            ? 'Saving…'
            : enabled
              ? 'Enabled'
              : 'Off'}
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
    flex: 1,
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
    marginTop: 13,
    maxWidth: 350,
  },

  /* Summary */

  summary: {
    minHeight: 68,
    backgroundColor: '#101010',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#202020',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  summaryIndicator: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#181715',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.champagne,
  },

  summaryCopy: {
    flex: 1,
    marginLeft: 11,
  },

  summaryTitle: {
    color: '#DCD9D2',
    fontSize: 12,
    fontWeight: '600',
  },

  summaryText: {
    color: '#62605A',
    fontSize: 10,
    marginTop: 3,
  },

  /* Section */

  sectionHeader: {
    marginBottom: 11,
  },


  sectionLabel: {
    color: '#5F5C57',
    fontSize: 11,
    fontWeight: '700',
      },

  /* Preferences */

  options: {
    borderTopWidth: 1,
    borderColor: '#1D1D1D',
  },

  preference: {
    minHeight: 142,
    borderBottomWidth: 1,
    borderBottomColor: '#1D1D1D',
    paddingVertical: 18,
  },

  preferenceEnabled: {
    // Deliberately subtle — state is communicated
    // by the switch and status indicator.
  },

  preferenceTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  preferenceTitleWrap: {
    flex: 1,
    paddingRight: 16,
  },


  preferenceEyebrow: {
    color: '#55524D',
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 6,
  },

  preferenceEyebrowEnabled: {
    color: colors.champagne,
  },


  preferenceTitle: {
    color: '#E4E1DA',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  preferenceDescription: {
    color: '#6E6A63',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 11,
    maxWidth: 325,
  },

  preferenceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  stateDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 7,
  },

  stateDotOn: {
    backgroundColor: colors.success,
  },

  stateDotOff: {
    backgroundColor: '#484640',
  },

  stateText: {
    color: '#55524D',
    fontSize: 9,
    fontWeight: '600',
  },

  stateTextOn: {
    color: '#7F9D88',
  },

  /* Footer */

  footer: {
    marginTop: 27,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#1D1D1D',
  },

  footerTitle: {
    color: '#9B978F',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },

  footerText: {
    color: '#5F5C57',
    fontSize: 10,
    lineHeight: 16,
  },
});
