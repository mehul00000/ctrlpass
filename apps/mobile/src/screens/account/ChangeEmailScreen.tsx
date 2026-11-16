import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field, Button } from '../../components';
import { useUser } from '@clerk/expo';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme';

export default function ChangeEmailScreen() {
  const insets = useSafeAreaInsets();
  const { session, refresh } = useAuth();
  const { user } = useUser();

  const current = session?.user?.email ?? '';

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  /** Unverified Clerk email awaiting the 6-digit code (Clerk requires
   * verifying a NEW address before it can become primary). */
  const [pendingVerification, setPendingVerification] = useState<{
    id: string;
    emailAddress: string;
  } | null>(null);
  const [code, setCode] = useState('');

  const normalizedEmail = email.trim();

  const isValidEmail =
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(
      normalizedEmail,
    );

  const isSameEmail =
    normalizedEmail.toLowerCase() ===
    current.toLowerCase();

  const emailState = useMemo(() => {
    if (!email) {
      return {
        label: 'Enter your new email address',
        tone: 'neutral' as const,
      };
    }

    if (!isValidEmail) {
      return {
        label: 'Enter a valid email address',
        tone: 'error' as const,
      };
    }

    if (isSameEmail) {
      return {
        label: 'This is already your current email',
        tone: 'error' as const,
      };
    }

    return {
      label: 'Email address looks good',
      tone: 'success' as const,
    };
  }, [
    email,
    isValidEmail,
    isSameEmail,
  ]);

  async function handleSave() {
    if (!isValidEmail) {
      Alert.alert(
        'Invalid email',
        'Enter a valid email address.',
      );
      return;
    }

    if (isSameEmail) {
      Alert.alert(
        'Email already in use',
        'Enter a different email address.',
      );
      return;
    }

    if (!user) {
      Alert.alert('Not signed in', 'Sign in again to update your email.');
      return;
    }

    setBusy(true);

    try {
      const emailResource = await user.createEmailAddress({
        email: normalizedEmail,
      });

      await emailResource.prepareVerification({
        strategy: 'email_code',
      });

      setPendingVerification({
        id: emailResource.id,
        emailAddress: normalizedEmail,
      });
      setCode('');
    } catch (err) {
      Alert.alert(
        'Could not send verification',
        (err as { errors?: Array<{ message?: string }> })?.errors?.[0]
          ?.message ?? 'Check the address and try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!user || !pendingVerification) return;

    if (code.replace(/\D/g, '').length !== 6) {
      Alert.alert('Incomplete code', 'Enter the full 6-digit code.');
      return;
    }

    setBusy(true);

    try {
      const emailResource = user.emailAddresses.find(
        candidate => candidate.id === pendingVerification.id,
      );

      if (!emailResource) {
        throw new Error('Verification session expired. Restart the change.');
      }

      await emailResource.attemptVerification({ code });
      await user.reload();

      const result = user.emailAddresses.find(
        candidate => candidate.id === pendingVerification.id,
      );

      if (result?.verification.status === 'verified') {
        await user.reload();

        const verified = user.emailAddresses.find(
          candidate =>
            candidate.emailAddress.toLowerCase() ===
            pendingVerification.emailAddress.toLowerCase(),
        );

        if (verified) {
          await user.update({ primaryEmailAddressId: verified.id });
        }

        Alert.alert(
          'Email updated',
          `${pendingVerification.emailAddress} is now your sign-in email.`,
        );

        setPendingVerification(null);
        setCode('');
        setEmail('');
        refresh();
      } else {
        Alert.alert(
          'Verification failed',
          'That code did not complete verification.',
        );
      }
    } catch (err) {
      Alert.alert(
        'Verification failed',
        (err as { errors?: Array<{ message?: string }> })?.errors?.[0]
          ?.message ?? (err instanceof Error ? err.message : 'Try again.'),
      );
    } finally {
      setBusy(false);
    }
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
          keyboardShouldPersistTaps="handled"
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
              ACCOUNT IDENTITY
            </Text>

            <Text style={styles.title}>
              Keep your inbox{'\n'}
              up to date.
            </Text>

            <Text style={styles.subtitle}>
              Your email is used for important account
              communication, booking updates and
              verification.
            </Text>
          </View>

          {/* Current email */}

          <View style={styles.currentSection}>
            <Text style={styles.sectionLabel}>
              CURRENT EMAIL
            </Text>

            <View style={styles.currentRow}>
              <View style={styles.mailMark}>
                <Text style={styles.mailMarkText}>
                  @
                </Text>
              </View>

              <View style={styles.currentCopy}>
                <Text
                  style={styles.currentEmail}
                  numberOfLines={1}
                >
                  {current || 'No email address'}
                </Text>

                <Text style={styles.currentStatus}>
                  Currently linked to your account
                </Text>
              </View>

              <View style={styles.verifiedDot} />
            </View>
          </View>

          {/* New email */}

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>
              NEW EMAIL
            </Text>

            <Field
              label=""
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />

            {email.length > 0 ? (
              <View style={styles.validationRow}>
                <View
                  style={[
                    styles.validationDot,
                    emailState.tone === 'success'
                      ? styles.validationSuccess
                      : emailState.tone === 'error'
                        ? styles.validationError
                        : styles.validationNeutral,
                  ]}
                />

                <Text
                  style={[
                    styles.validationText,
                    emailState.tone === 'success'
                      ? styles.validationTextSuccess
                      : emailState.tone === 'error'
                        ? styles.validationTextError
                        : styles.validationTextNeutral,
                  ]}
                >
                  {emailState.label}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Verification flow */}

          <View style={styles.flowSection}>
            <Text style={styles.sectionLabel}>
              WHAT HAPPENS NEXT
            </Text>

            <FlowStep
              number="01"
              title="Enter your new address"
              description="Use an inbox you can access right now."
            />

            <FlowConnector />

            <FlowStep
              number="02"
              title="Confirm ownership"
              description="We'll send a verification link to the new address."
            />

            <FlowConnector />

            <FlowStep
              number="03"
              title="Email gets updated"
              description="Your new address becomes active after verification."
              last
            />
          </View>

          {/* Security note */}

          <View style={styles.securityNote}>
            <View style={styles.securityIcon}>
              <Text style={styles.securityIconText}>
                ✓
              </Text>
            </View>

            <View style={styles.securityCopy}>
              <Text style={styles.securityTitle}>
                Verification required
              </Text>

              <Text style={styles.securityText}>
                CtrlPass won't replace your current email
                until the new address has been verified.
              </Text>
            </View>
          </View>

          {/* Verification code (shown once Clerk has emailed the code) */}

          {pendingVerification ? (
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>
                VERIFY {pendingVerification.emailAddress.toUpperCase()}
              </Text>

              <Field
                label=""
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
            </View>
          ) : null}

          {/* CTA */}

          <View style={styles.cta}>
            <Button
              title={pendingVerification ? 'Verify & update email' : 'Send verification'}
              onPress={pendingVerification ? handleVerify : handleSave}
              loading={busy}
            />

            <Text style={styles.ctaHint}>
              {pendingVerification
                ? 'Enter the 6-digit code sent to your new inbox.'
                : 'Make sure you can access the new inbox before continuing.'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FlowStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <View style={styles.flowStep}>
      <View style={styles.flowNumber}>
        <Text style={styles.flowNumberText}>
          {number}
        </Text>
      </View>

      <View style={styles.flowCopy}>
        <Text style={styles.flowTitle}>
          {title}
        </Text>

        <Text style={styles.flowDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function FlowConnector() {
  return <View style={styles.flowConnector} />;
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
    paddingTop: 10,
    marginBottom: 31,
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
    letterSpacing: -1.15,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 13,
    maxWidth: 350,
  },

  /* Current email */

  currentSection: {
    marginBottom: 31,
  },


  sectionLabel: {
    color: '#5F5C57',
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 11,
  },

  currentRow: {
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#202020',
    backgroundColor: '#101010',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  mailMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1815',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mailMarkText: {
    color: colors.champagne,
    fontSize: 15,
    fontWeight: '700',
  },

  currentCopy: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },

  currentEmail: {
    color: '#E9E7E1',
    fontSize: 13,
    fontWeight: '600',
  },

  currentStatus: {
    color: '#5F5C57',
    fontSize: 10,
    marginTop: 4,
  },

  verifiedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },

  /* Form */

  formSection: {
    marginBottom: 31,
  },

  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    paddingLeft: 3,
  },

  validationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },

  validationSuccess: {
    backgroundColor: colors.success,
  },

  validationError: {
    backgroundColor: colors.error,
  },

  validationNeutral: {
    backgroundColor: '#77736C',
  },

  validationText: {
    fontSize: 10,
  },

  validationTextSuccess: {
    color: colors.success,
  },

  validationTextError: {
    color: colors.error,
  },

  validationTextNeutral: {
    color: colors.textMuted,
  },

  /* Flow */

  flowSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1D1D1D',
    paddingTop: 20,
    paddingBottom: 19,
    marginBottom: 20,
  },

  flowStep: {
    flexDirection: 'row',
    minHeight: 52,
  },

  flowNumber: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
  },


  flowNumberText: {
    color: colors.champagne,
    fontSize: 11,
    fontWeight: '700',
      },

  flowCopy: {
    flex: 1,
    marginLeft: 12,
    paddingTop: 1,
  },

  flowTitle: {
    color: '#DAD8D1',
    fontSize: 12,
    fontWeight: '600',
  },

  flowDescription: {
    color: '#65615B',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
    paddingRight: 15,
  },

  flowConnector: {
    width: 1,
    height: 13,
    backgroundColor: '#292929',
    marginLeft: 15,
    marginVertical: 2,
  },

  /* Security */

  securityNote: {
    flexDirection: 'row',
    backgroundColor: '#0D0D0D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1C1C1C',
    padding: 14,
    marginBottom: 26,
  },

  securityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(127,191,154,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(127,191,154,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  securityIconText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
  },

  securityCopy: {
    flex: 1,
    marginLeft: 11,
  },

  securityTitle: {
    color: '#D5D2CB',
    fontSize: 11,
    fontWeight: '600',
  },

  securityText: {
    color: '#65615B',
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
    paddingHorizontal: 28,
  },
});