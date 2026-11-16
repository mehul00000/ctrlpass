import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Checkbox } from '../../components/checkbox';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { accountService, CONSENT_DOCS } from '../../services/account';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme';

const COLLECTED = [
  [
    '01',
    'Account details',
    'Name, email or phone number — to create your account and issue tickets.',
  ],
  [
    '02',
    'Booking data',
    'Events you book, tickets issued to you, and payment status. Payment card details stay with our payment provider; CtrlPass never stores card numbers.',
  ],
  [
    '03',
    'Check-in records',
    'Time and gate of your entry scans at events you attend.',
  ],
  [
    '04',
    'Device & technical data',
    'Basic app diagnostics needed to keep the service working.',
  ],
] as const;

export default function ConsentScreen() {
  const { acceptConsent } = useAuth();
  const insets = useSafeAreaInsets();

  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleAccept() {
    if (!agreed || busy) return;

    setBusy(true);

    try {
      await Promise.all([
        accountService.recordConsent(
          CONSENT_DOCS.TERMS.document,
          CONSENT_DOCS.TERMS.version,
        ),
        accountService.recordConsent(
          CONSENT_DOCS.PRIVACY.document,
          CONSENT_DOCS.PRIVACY.version,
        ),
        accountService.recordConsent(
          CONSENT_DOCS.DATA.document,
          CONSENT_DOCS.DATA.version,
        ),
      ]);

      acceptConsent();
    } catch (e: any) {
      Alert.alert(
        'Could not save consent',
        e?.message ?? 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: 170 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}

        <View style={styles.header}>
          <View style={styles.privacyMark}>
            <Text style={styles.privacyMarkText}>✓</Text>
          </View>

          <Text style={styles.kicker}>
            YOUR PRIVACY
          </Text>

          <Text style={styles.title}>
            Before you{'\n'}step inside.
          </Text>

          <Text style={styles.intro}>
            CtrlPass needs to process a small amount
            of information to create your account,
            issue tickets and keep event entry secure.
          </Text>
        </View>

        {/* What we collect */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>
            WHAT WE USE
          </Text>

          <Text style={styles.sectionTitle}>
            Only what the experience needs.
          </Text>
        </View>

        <View style={styles.dataList}>
          {COLLECTED.map(
            ([number, title, body], index) => (
              <View
                key={title}
                style={[
                  styles.dataRow,
                  index === COLLECTED.length - 1 &&
                    styles.dataRowLast,
                ]}
              >
                <Text style={styles.dataNumber}>
                  {number}
                </Text>

                <View style={styles.dataCopy}>
                  <Text style={styles.dataTitle}>
                    {title}
                  </Text>

                  <Text style={styles.dataBody}>
                    {body}
                  </Text>
                </View>
              </View>
            ),
          )}
        </View>

        {/* Required / optional */}

        <View style={styles.principleBlock}>
          <View style={styles.principleTop}>
            <Text style={styles.sectionEyebrow}>
              YOUR CONTROL
            </Text>

            <View style={styles.controlPill}>
              <Text style={styles.controlPillText}>
                YOU DECIDE
              </Text>
            </View>
          </View>

          <Text style={styles.principleTitle}>
            Required for tickets.
            {'\n'}
            Optional for personalisation.
          </Text>

          <Text style={styles.principleBody}>
            Your name and contact detail are required
            to issue a valid ticket. City and profile
            photo are optional and only used to
            personalise your account.
          </Text>

          <Text style={styles.principleBody}>
            You can request deletion of your account
            at any time from Account → Privacy.
          </Text>
        </View>

        {/* Agreement */}

        <View style={styles.agreement}>
          <Checkbox
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked)}
            label="I understand and agree"
            description="I have read and agree to the Terms of Service and Privacy Policy, and consent to CtrlPass processing my data as described above."
          />
        </View>

        {/* Legal links */}

        <View style={styles.links}>
          <Pressable
            onPress={() =>
              Linking.openURL(
                'https://ctrlpass.in/terms',
              )
            }
            hitSlop={8}
          >
            <Text style={styles.link}>
              Terms of Service
            </Text>
          </Pressable>

          <View style={styles.linkDot} />

          <Pressable
            onPress={() =>
              Linking.openURL(
                'https://ctrlpass.in/privacy',
              )
            }
            hitSlop={8}
          >
            <Text style={styles.link}>
              Privacy Policy
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Fixed action area */}

      <View
        style={[
          styles.footer,
          {
            paddingBottom:
              Math.max(insets.bottom, 10),
          },
        ]}
      >
        <View style={styles.footerInner}>
          <View style={styles.footerStatus}>
            <View
              style={[
                styles.statusDot,
                agreed && styles.statusDotActive,
              ]}
            />

            <Text style={styles.footerStatusText}>
              {agreed
                ? 'Ready to continue'
                : 'Agreement required'}
            </Text>
          </View>

          <Pressable
            onPress={handleAccept}
            disabled={!agreed || busy}
            accessibilityRole="button"
            accessibilityLabel="Agree and continue"
            style={({ pressed }) => [
              styles.continueButton,
              !agreed && styles.continueDisabled,
              busy && styles.continueDisabled,
              pressed &&
                agreed &&
                !busy &&
                styles.pressed,
            ]}
          >
            <Text style={styles.continueText}>
              {busy
                ? 'Saving…'
                : 'Agree & Continue'}
            </Text>

            {!busy && agreed ? (
              <Text style={styles.continueArrow}>
                →
              </Text>
            ) : null}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 24,
  },

  /* Header */

  header: {
    paddingTop: 8,
    paddingBottom: 42,
  },

  privacyMark: {
    width: 48,
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.28)',
    backgroundColor: 'rgba(214,180,122,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 27,
  },

  privacyMarkText: {
    color: '#D6B47A',
    fontSize: 18,
    fontWeight: '700',
  },


  kicker: {
    color: '#9E7B48',
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 12,
  },


  title: {
    color: '#F5F5F2',
    fontSize: 38,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: -1.5,
  },

  intro: {
    color: '#85817A',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 16,
    maxWidth: 350,
  },

  /* Sections */

  sectionHeader: {
    marginBottom: 15,
  },


  sectionEyebrow: {
    color: '#66625C',
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 7,
  },


  sectionTitle: {
    color: '#D8D5CE',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    letterSpacing: -0.3,
  },

  /* Data list */

  dataList: {
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: '#20201E',
    borderRadius: 21,
    overflow: 'hidden',
  },

  dataRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1A',
  },

  dataRowLast: {
    borderBottomWidth: 0,
  },


  dataNumber: {
    width: 29,
    color: '#8D7045',
    fontSize: 11,
    fontWeight: '700',
        paddingTop: 2,
  },

  dataCopy: {
    flex: 1,
    paddingRight: 4,
  },

  dataTitle: {
    color: '#E5E2DC',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },

  dataBody: {
    color: '#74716B',
    fontSize: 11,
    lineHeight: 17,
  },

  /* Control */

  principleBlock: {
    marginTop: 30,
    paddingTop: 24,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1C1C1A',
  },

  principleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  controlPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(127,191,154,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(127,191,154,0.18)',
  },


  controlPillText: {
    color: '#7FBF9A',
    fontSize: 11,
    fontWeight: '700',
      },


  principleTitle: {
    color: '#E5E2DC',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.4,
    marginTop: 11,
  },

  principleBody: {
    color: '#74716B',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 12,
  },

  /* Agreement */

  agreement: {
    marginTop: 25,
    padding: 16,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#272622',
    backgroundColor: '#0D0D0D',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  agreementActive: {
    borderColor: 'rgba(214,180,122,0.38)',
    backgroundColor: 'rgba(214,180,122,0.045)',
  },

  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#4A4741',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },

  checkboxActive: {
    backgroundColor: '#D6B47A',
    borderColor: '#D6B47A',
  },

  check: {
    color: '#090909',
    fontSize: 13,
    fontWeight: '800',
  },

  agreementCopy: {
    flex: 1,
  },

  agreementTitle: {
    color: '#E4E1DA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },

  agreementText: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },

  /* Links */

  links: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 17,
    paddingHorizontal: 2,
  },

  link: {
    color: '#A38A60',
    fontSize: 10,
    fontWeight: '600',
  },

  linkDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#45413A',
    marginHorizontal: 12,
  },

  /* Footer */

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5,5,5,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#1B1B19',
    paddingTop: 12,
    paddingHorizontal: 18,
  },

  footerInner: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },

  footerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#45423D',
    marginRight: 7,
  },

  statusDotActive: {
    backgroundColor: '#7FBF9A',
  },

  footerStatusText: {
    color: '#625E58',
    fontSize: 9,
    fontWeight: '500',
  },

  continueButton: {
    height: 53,
    borderRadius: 16,
    backgroundColor: '#E8E3D9',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  continueDisabled: {
    backgroundColor: '#1A1917',
    opacity: 0.7,
  },

  continueText: {
    color: '#090909',
    fontSize: 13,
    fontWeight: '700',
  },

  continueArrow: {
    color: '#090909',
    fontSize: 17,
    marginLeft: 9,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
});