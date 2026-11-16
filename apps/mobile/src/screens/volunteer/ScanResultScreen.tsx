import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { VolunteerStackParamList } from '../../navigation/types';
import { formatDateTime } from '../../lib/utils';
import { scanStatusLabel } from '../../lib/scanStatus';
import { colors } from '../../theme';

type Props = NativeStackScreenProps<
  VolunteerStackParamList,
  'ScanResult'
>;

type ResultTone = 'success' | 'warning' | 'error';

export default function ScanResultScreen({
  route,
  navigation,
}: Props) {
  const { eventId, result } = route.params;

  const label = scanStatusLabel(result.status);

  const isValid = result.status === 'VALID';

  const isDuplicate =
    result.status === 'ALREADY_CHECKED_IN' ||
    result.status === 'DUPLICATE';

  const isWindow =
    result.status === 'ENTRY_NOT_OPEN' ||
    result.status === 'ENTRY_CLOSED';

  const tone: ResultTone = isValid
    ? 'success'
    : isDuplicate || isWindow
      ? 'warning'
      : 'error';

  const palette = {
    success: {
      accent: '#7FBF9A',
      soft: 'rgba(127,191,154,0.10)',
      border: 'rgba(127,191,154,0.25)',
      iconBg: '#7FBF9A',
      iconText: '#07100B',
    },
    warning: {
      accent: '#D6B47A',
      soft: 'rgba(214,180,122,0.10)',
      border: 'rgba(214,180,122,0.25)',
      iconBg: '#D6B47A',
      iconText: '#171109',
    },
    error: {
      accent: '#D96B6B',
      soft: 'rgba(217,107,107,0.10)',
      border: 'rgba(217,107,107,0.25)',
      iconBg: '#D96B6B',
      iconText: '#170707',
    },
  }[tone];

  const icon = isValid
    ? '✓'
    : isDuplicate
      ? '!'
      : '×';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}

          <View style={styles.topBar}>
            <Pressable
              onPress={() =>
                navigation.navigate('QRScanner', {
                  eventId,
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Scan another attendee"
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.backArrow}>‹</Text>
            </Pressable>

            <View style={styles.topBarCenter}>
              <Text style={styles.topEyebrow}>
                GATE CONTROL
              </Text>
              <Text style={styles.topTitle}>
                Verification result
              </Text>
            </View>

            <View style={styles.secureMark}>
              <View style={styles.secureDot} />
            </View>
          </View>

          {/* Main result */}

          <View
            style={[
              styles.resultCard,
              {
                borderColor: palette.border,
                backgroundColor: palette.soft,
              },
            ]}
          >
            <View
              style={[
                styles.resultIcon,
                {
                  backgroundColor: palette.iconBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.resultIconText,
                  {
                    color: palette.iconText,
                  },
                ]}
              >
                {icon}
              </Text>
            </View>

            <Text
              style={[
                styles.resultLabel,
                {
                  color: palette.accent,
                },
              ]}
            >
              {isValid
                ? 'ENTRY APPROVED'
                : isDuplicate
                  ? 'ENTRY ALREADY USED'
                  : isWindow
                    ? 'ENTRY WINDOW ISSUE'
                    : 'ENTRY DENIED'}
            </Text>

            <Text style={styles.resultTitle}>
              {label}
            </Text>

            <Text style={styles.resultMessage}>
              {result.message}
            </Text>

            <View
              style={[
                styles.resultStatusPill,
                {
                  borderColor: palette.border,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      palette.accent,
                  },
                ]}
              />

              <Text
                style={[
                  styles.statusPillText,
                  {
                    color: palette.accent,
                  },
                ]}
              >
                {result.status.replace(
                  /_/g,
                  ' ',
                )}
              </Text>
            </View>
          </View>

          {/* Credentials */}

          {result.attendee_name ||
          result.ticket_type ||
          result.checked_in_at ? (
            <View style={styles.credentialsSection}>
              <View style={styles.sectionHeading}>
                <View>
                  <Text style={styles.sectionEyebrow}>
                    PASS DETAILS
                  </Text>

                  <Text style={styles.sectionTitle}>
                    Verified credentials
                  </Text>
                </View>

                <View style={styles.verifiedMark}>
                  <Text style={styles.verifiedMarkText}>
                    ✓
                  </Text>
                </View>
              </View>

              <View style={styles.credentialsCard}>
                {result.attendee_name ? (
                  <DetailRow
                    label="ATTENDEE"
                    value={result.attendee_name}
                    prominent
                  />
                ) : null}

                {result.ticket_type ? (
                  <DetailRow
                    label="TICKET TIER"
                    value={result.ticket_type}
                  />
                ) : null}

                {result.checked_in_at ? (
                  <DetailRow
                    label={
                      isValid
                        ? 'CHECK-IN TIME'
                        : 'PREVIOUS CHECK-IN'
                    }
                    value={formatDateTime(
                      result.checked_in_at,
                    )}
                    last
                  />
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Verification note */}

          <View style={styles.verificationNote}>
            <View style={styles.noteIcon}>
              <Text style={styles.noteIconText}>
                i
              </Text>
            </View>

            <View style={styles.noteCopy}>
              <Text style={styles.noteTitle}>
                Server verified
              </Text>

              <Text style={styles.noteBody}>
                This result was returned by CtrlPass
                check-in verification. Do not admit an
                attendee based on a screenshot or visual
                QR match alone.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>

        {/* Fixed actions */}

        <View style={styles.actionArea}>
          <Pressable
            onPress={() =>
              navigation.navigate('QRScanner', {
                eventId,
              })
            }
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Scan next attendee
            </Text>

            <Text style={styles.primaryArrow}>
              →
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              navigation.navigate('VolunteerHome')
            }
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              Return to gate hub
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  prominent = false,
  last = false,
}: {
  label: string;
  value: string;
  prominent?: boolean;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.detailRow,
        !last && styles.detailRowBorder,
      ]}
    >
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.detailValue,
          prominent && styles.detailValueProminent,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
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

  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 190,
  },

  /* ───────── Top bar ───────── */

  topBar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    color: '#F5F5F2',
    fontSize: 29,
    lineHeight: 28,
    marginTop: -2,
  },

  topBarCenter: {
    flex: 1,
    marginHorizontal: 12,
  },


  topEyebrow: {
    color: '#706C65',
    fontSize: 11,
    fontWeight: '800',
      },

  topTitle: {
    color: '#EAE7E0',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },

  secureMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#10100F',
    borderWidth: 1,
    borderColor: '#24231F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secureDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7FBF9A',
  },

  /* ───────── Result ───────── */

  resultCard: {
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
    marginTop: 14,
  },

  resultIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  resultIconText: {
    fontSize: 33,
    lineHeight: 37,
    fontWeight: '800',
  },


  resultLabel: {
    fontSize: 11,
    fontWeight: '900',
      },


  resultTitle: {
    color: '#F5F5F2',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginTop: 8,
  },

  resultMessage: {
    color: '#8F8B83',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 310,
  },

  resultStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 17,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 7,
  },


  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
      },

  /* ───────── Credentials ───────── */

  credentialsSection: {
    marginTop: 28,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },


  sectionEyebrow: {
    color: '#6B6760',
    fontSize: 11,
    fontWeight: '800',
      },

  sectionTitle: {
    color: '#E7E4DD',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },

  verifiedMark: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(127,191,154,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(127,191,154,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifiedMarkText: {
    color: '#7FBF9A',
    fontSize: 13,
    fontWeight: '800',
  },

  credentialsCard: {
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222222',
    overflow: 'hidden',
  },

  detailRow: {
    paddingHorizontal: 16,
    paddingVertical: 15,
  },

  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#202020',
  },


  detailLabel: {
    color: '#69655F',
    fontSize: 11,
    fontWeight: '800',
        marginBottom: 6,
  },

  detailValue: {
    color: '#D0CCC4',
    fontSize: 12,
    fontWeight: '500',
  },

  detailValueProminent: {
    color: '#F2EFE8',
    fontSize: 16,
    fontWeight: '600',
  },

  /* ───────── Verification note ───────── */

  verificationNote: {
    flexDirection: 'row',
    marginTop: 14,
    padding: 14,
    borderRadius: 17,
    backgroundColor: '#0D0D0C',
    borderWidth: 1,
    borderColor: '#1C1C1A',
  },

  noteIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: '#171613',
    alignItems: 'center',
    justifyContent: 'center',
  },

  noteIconText: {
    color: '#8B867E',
    fontSize: 12,
    fontWeight: '700',
  },

  noteCopy: {
    flex: 1,
    marginLeft: 10,
  },

  noteTitle: {
    color: '#B7B3AB',
    fontSize: 10,
    fontWeight: '700',
  },

  noteBody: {
    color: '#69655F',
    fontSize: 9,
    lineHeight: 15,
    marginTop: 3,
  },

  bottomSpace: {
    height: 10,
  },

  /* ───────── Actions ───────── */

  actionArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'rgba(5,5,5,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#171717',
  },

  primaryButton: {
    height: 53,
    borderRadius: 17,
    backgroundColor: '#E8E3D9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#080808',
    fontSize: 13,
    fontWeight: '700',
  },

  primaryArrow: {
    color: '#080808',
    fontSize: 18,
    marginLeft: 9,
  },

  secondaryButton: {
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
});