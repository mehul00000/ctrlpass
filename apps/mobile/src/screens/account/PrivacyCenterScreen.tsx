import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingState } from '../../components';
import {
  accountService,
  CONSENT_DOCS,
} from '../../services/account';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme';

const DOC_LABEL: Record<string, string> = {
  TERMS: 'Terms of Service',
  PRIVACY: 'Privacy Policy',
  DATA: 'Data usage consent',
};

export default function PrivacyCenterScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [consents, setConsents] = useState<
    {
      document: string;
      version: string;
      accepted_at: string;
    }[] | null
  >(null);

  useEffect(() => {
    accountService
      .listMyConsents()
      .then(setConsents);
  }, []);

  const latest = (doc: string) =>
    consents?.find(
      consent => consent.document === doc,
    );

  if (consents === null) {
    return (
      <View style={styles.loadingScreen}>
        <LoadingState message="Loading privacy controls..." />
      </View>
    );
  }

  const acceptedCount = Object.values(
    CONSENT_DOCS,
  ).filter(({ document }) => latest(document)).length;

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 42,
          },
        ]}
      >
        {/* Header */}

        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            PRIVACY & DATA
          </Text>

          <Text style={styles.title}>
            Your data.{'\n'}
            Your control.
          </Text>

          <Text style={styles.subtitle}>
            Review how CtrlPass uses your information and
            manage the controls available to your account.
          </Text>
        </View>

        {/* Privacy overview */}

        <View style={styles.overview}>
          <View style={styles.overviewIcon}>
            <View style={styles.shield}>
              <View style={styles.shieldInner} />
            </View>
          </View>

          <View style={styles.overviewCopy}>
            <Text style={styles.overviewTitle}>
              Privacy is part of the product
            </Text>

            <Text style={styles.overviewText}>
              CtrlPass stores account details, bookings,
              tickets and check-in records to operate the
              service.
            </Text>
          </View>
        </View>

        <View style={styles.paymentNote}>
          <View style={styles.paymentDot} />

          <Text style={styles.paymentText}>
            Card numbers are handled by our payment
            provider and do not touch CtrlPass servers.
          </Text>
        </View>

        {/* Consent */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              CONSENT RECORDS
            </Text>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {acceptedCount}/{Object.values(CONSENT_DOCS).length}
              </Text>
            </View>
          </View>

          <View style={styles.consentList}>
            {Object.values(CONSENT_DOCS).map(
              ({ document, version }, index) => {
                const record = latest(document);
                const accepted = Boolean(record);

                return (
                  <View
                    key={document}
                    style={[
                      styles.consentRow,
                      index ===
                        Object.values(CONSENT_DOCS).length -
                          1 &&
                        styles.consentRowLast,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusIcon,
                        accepted
                          ? styles.statusAccepted
                          : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusSymbol,
                          accepted
                            ? styles.statusSymbolAccepted
                            : styles.statusSymbolPending,
                        ]}
                      >
                        {accepted ? '✓' : '—'}
                      </Text>
                    </View>

                    <View style={styles.consentCopy}>
                      <Text style={styles.consentTitle}>
                        {DOC_LABEL[document]}
                      </Text>

                      <Text style={styles.consentMeta}>
                        {record
                          ? `Accepted v${record.version} · ${new Date(
                              record.accepted_at,
                            ).toLocaleDateString()}`
                          : `Current version v${version} · not accepted`}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.consentState,
                        accepted
                          ? styles.acceptedPill
                          : styles.pendingPill,
                      ]}
                    >
                      <Text
                        style={[
                          styles.consentStateText,
                          accepted
                            ? styles.acceptedText
                            : styles.pendingText,
                        ]}
                      >
                        {accepted
                          ? 'Accepted'
                          : 'Review'}
                      </Text>
                    </View>
                  </View>
                );
              },
            )}
          </View>
        </View>

        {/* Controls */}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            YOUR CONTROLS
          </Text>

          <View style={styles.controls}>
            <PrivacyAction
              label="Notification preferences"
              description="Choose which updates you receive."
              onPress={() =>
                navigation.navigate(
                  'NotificationSettings',
                )
              }
            />

            <PrivacyAction
              label="Terms of Service"
              description="Read the rules governing CtrlPass."
              onPress={() =>
                navigation.navigate('Info', {
                  doc: 'terms',
                })
              }
            />

            <PrivacyAction
              label="Privacy Policy"
              description="See how your information is handled."
              onPress={() =>
                navigation.navigate('Info', {
                  doc: 'privacy',
                })
              }
            />

            <PrivacyAction
              label="Delete account"
              description="Deactivate your CtrlPass account."
              destructive
              onPress={() =>
                navigation.navigate(
                  'DeleteAccount',
                )
              }
              last
            />
          </View>
        </View>

        {/* Signed in identity */}

        <View style={styles.identity}>
          <Text style={styles.identityLabel}>
            ACCOUNT
          </Text>

          <Text style={styles.identityValue}>
            {session?.user?.email ??
              session?.user?.phone ??
              '—'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function PrivacyAction({
  label,
  description,
  onPress,
  destructive,
  last,
}: {
  label: string;
  description: string;
  onPress: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.action,
        last && styles.actionLast,
        pressed && styles.actionPressed,
      ]}
    >
      <View style={styles.actionCopy}>
        <Text
          style={[
            styles.actionLabel,
            destructive && styles.actionLabelDanger,
          ]}
        >
          {label}
        </Text>

        <Text style={styles.actionDescription}>
          {description}
        </Text>
      </View>

      <View style={styles.actionArrow}>
        <Text
          style={[
            styles.arrow,
            destructive && styles.arrowDanger,
          ]}
        >
          ›
        </Text>
      </View>
    </Pressable>
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
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -1.2,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 13,
    maxWidth: 350,
  },

  /* Overview */

  overview: {
    backgroundColor: '#101010',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#202020',
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#181715',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  shield: {
    width: 22,
    height: 25,
    borderWidth: 1.5,
    borderColor: colors.champagne,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shieldInner: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.champagne,
  },

  overviewCopy: {
    flex: 1,
    marginLeft: 13,
  },

  overviewTitle: {
    color: '#DDDAD3',
    fontSize: 12,
    fontWeight: '600',
  },

  overviewText: {
    color: '#69655F',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  paymentNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 5,
    marginTop: 11,
    marginBottom: 29,
  },

  paymentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7F9D88',
    marginTop: 5,
    marginRight: 8,
  },

  paymentText: {
    flex: 1,
    color: '#5E5B55',
    fontSize: 10,
    lineHeight: 16,
  },

  /* Sections */

  section: {
    marginBottom: 29,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },


  sectionLabel: {
    color: '#5F5C57',
    fontSize: 11,
    fontWeight: '700',
      },

  countBadge: {
    backgroundColor: '#111111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#252525',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  countText: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
  },

  /* Consent */

  consentList: {
    borderTopWidth: 1,
    borderColor: '#1D1D1D',
  },

  consentRow: {
    minHeight: 73,
    borderBottomWidth: 1,
    borderBottomColor: '#1D1D1D',
    flexDirection: 'row',
    alignItems: 'center',
  },

  consentRowLast: {
    borderBottomWidth: 0,
  },

  statusIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusAccepted: {
    backgroundColor: 'rgba(127,191,154,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(127,191,154,0.2)',
  },

  statusPending: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#292929',
  },

  statusSymbol: {
    fontSize: 11,
    fontWeight: '700',
  },

  statusSymbolAccepted: {
    color: colors.success,
  },

  statusSymbolPending: {
    color: '#66625C',
  },

  consentCopy: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 8,
  },

  consentTitle: {
    color: '#D8D5CE',
    fontSize: 12,
    fontWeight: '600',
  },

  consentMeta: {
    color: '#62605A',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  consentState: {
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  acceptedPill: {
    backgroundColor: 'rgba(127,191,154,0.07)',
  },

  pendingPill: {
    backgroundColor: '#151515',
  },

  consentStateText: {
    fontSize: 8,
    fontWeight: '700',
  },

  acceptedText: {
    color: '#7F9D88',
  },

  pendingText: {
    color: '#6C6861',
  },

  /* Controls */

  controls: {
    backgroundColor: '#101010',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#202020',
    paddingHorizontal: 15,
  },

  action: {
    minHeight: 68,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  actionLast: {
    borderBottomWidth: 0,
  },

  actionPressed: {
    opacity: 0.65,
  },

  actionCopy: {
    flex: 1,
    paddingRight: 12,
  },

  actionLabel: {
    color: '#D6D3CC',
    fontSize: 12,
    fontWeight: '600',
  },

  actionLabelDanger: {
    color: colors.error,
  },

  actionDescription: {
    color: '#625F59',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  actionArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#191919',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow: {
    color: '#96928A',
    fontSize: 19,
    lineHeight: 21,
    marginTop: -2,
  },

  arrowDanger: {
    color: colors.error,
  },

  /* Identity */

  identity: {
    alignItems: 'center',
    paddingTop: 4,
  },


  identityLabel: {
    color: '#4F4C47',
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 5,
  },

  identityValue: {
    color: '#6D6962',
    fontSize: 10,
  },
});