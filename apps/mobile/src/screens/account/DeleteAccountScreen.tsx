import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Checkbox } from '../../components/checkbox';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components';
import { accountService } from '../../services/account';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme';

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    Alert.alert(
      'Delete account',
      'Your account will be deactivated and you will be signed out. This cannot be undone from the app.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);

            try {
              await accountService.deactivateAccount();
              await signOut();
            } catch (e: any) {
              Alert.alert(
                'Could not delete account',
                e?.message ?? 'Try again later.',
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
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
              ACCOUNT CONTROL
            </Text>

            <View style={styles.warningMark}>
              <View style={styles.warningInner}>
                <Text style={styles.warningSymbol}>
                  !
                </Text>
              </View>
            </View>

            <Text style={styles.title}>
              Leaving CtrlPass?
            </Text>

            <Text style={styles.subtitle}>
              Deleting your account is a permanent decision
              from the app. Review what happens before you
              continue.
            </Text>
          </View>

          {/* What happens */}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              WHAT HAPPENS
            </Text>

            <DeleteRow
              number="01"
              title="Account is deactivated"
              description="Your account becomes inactive and you are signed out immediately."
            />

            <DeleteDivider />

            <DeleteRow
              number="02"
              title="Upcoming tickets remain valid"
              description="Tickets you've already received remain valid for event entry."
            />

            <DeleteDivider />

            <DeleteRow
              number="03"
              title="Booking records are retained"
              description="Issued tickets and booking records remain available where required for event and payment records."
            />

            <DeleteDivider />

            <DeleteRow
              number="04"
              title="Personal-data erasure"
              description="Full erasure of personal data is completed by administration on request."
              last
            />
          </View>

          {/* Important */}

          <View style={styles.infoBox}>
            <View style={styles.infoMark}>
              <Text style={styles.infoMarkText}>
                i
              </Text>
            </View>

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>
                This action can't be reversed in the app
              </Text>

              <Text style={styles.infoText}>
                If you only want to take a break, you can
                leave your account inactive instead of
                permanently requesting deletion.
              </Text>
            </View>
          </View>

          {/* Confirmation */}

          <View style={styles.confirmRow}>
            <Checkbox
              checked={confirm}
              onCheckedChange={(checked) => setConfirm(checked)}
              label="I understand"
              description="I understand that my account will be deactivated and I will be signed out."
            />
          </View>

          {/* CTA */}

          <View style={styles.cta}>
            <Button
              title="Delete my account"
              onPress={handleDelete}
              disabled={!confirm}
              loading={busy}
              variant="danger"
            />

            <Text style={styles.ctaHint}>
              You'll receive the final confirmation before
              the deletion action is executed.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function DeleteRow({
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
        styles.deleteRow,
        last && styles.deleteRowLast,
      ]}
    >
      <View style={styles.rowNumber}>
        <Text style={styles.rowNumberText}>
          {number}
        </Text>
      </View>

      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>
          {title}
        </Text>

        <Text style={styles.rowDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function DeleteDivider() {
  return <View style={styles.deleteDivider} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  flex: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
  },

  /* Header */

  header: {
    paddingTop: 8,
    marginBottom: 31,
  },


  eyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 22,
  },

  warningMark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(217,107,107,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  warningInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(217,107,107,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(217,107,107,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  warningSymbol: {
    color: colors.error,
    fontSize: 20,
    fontWeight: '700',
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
    maxWidth: 350,
  },

  /* What happens */

  section: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1D1D1D',
    paddingTop: 20,
    paddingBottom: 5,
    marginBottom: 20,
  },


  sectionLabel: {
    color: '#5F5C57',
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 17,
  },

  deleteRow: {
    flexDirection: 'row',
    minHeight: 60,
  },

  deleteRowLast: {
    marginBottom: 8,
  },

  rowNumber: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
  },


  rowNumberText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
      },

  rowCopy: {
    flex: 1,
    marginLeft: 12,
    paddingTop: 1,
  },

  rowTitle: {
    color: '#D8D5CE',
    fontSize: 12,
    fontWeight: '600',
  },

  rowDescription: {
    color: '#65615B',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
    paddingRight: 5,
  },

  deleteDivider: {
    width: 1,
    height: 13,
    backgroundColor: '#292929',
    marginLeft: 15,
    marginVertical: 2,
  },

  /* Information */

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#0D0D0D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#202020',
    padding: 14,
    marginBottom: 22,
  },

  infoMark: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#323232',
    backgroundColor: '#171717',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoMarkText: {
    color: '#99958D',
    fontSize: 12,
    fontWeight: '700',
  },

  infoCopy: {
    flex: 1,
    marginLeft: 11,
  },

  infoTitle: {
    color: '#D2CFC8',
    fontSize: 11,
    fontWeight: '600',
  },

  infoText: {
    color: '#65615B',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  /* Confirmation */

  confirmRow: {
    minHeight: 76,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#252525',
    backgroundColor: '#101010',
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  confirmPressed: {
    opacity: 0.78,
  },

  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#55514A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },

  check: {
    color: '#050505',
    fontSize: 13,
    fontWeight: '800',
  },

  confirmCopy: {
    flex: 1,
    marginLeft: 12,
  },

  confirmTitle: {
    color: '#DDDAD3',
    fontSize: 12,
    fontWeight: '600',
  },

  confirmText: {
    color: '#66625C',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  /* CTA */

  cta: {
    marginTop: 2,
  },

  ctaHint: {
    color: '#55524D',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 25,
  },
});