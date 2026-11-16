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
import { colors } from '../../theme';

export default function ChangePasswordScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const strength = useMemo(() => {
    if (!password) {
      return {
        label: 'Enter a new password',
        level: 0,
      };
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      return {
        label: 'Weak password',
        level: 1,
      };
    }

    if (score <= 3) {
      return {
        label: 'Good password',
        level: 2,
      };
    }

    return {
      label: 'Strong password',
      level: 3,
    };
  }, [password]);

  const matches =
    confirm.length > 0 && password === confirm;

  async function handleSave() {
    if (password.length < 8) {
      Alert.alert(
        'Too short',
        'Use at least 8 characters.',
      );
      return;
    }

    if (password !== confirm) {
      Alert.alert(
        'Mismatch',
        'Passwords do not match.',
      );
      return;
    }

    setBusy(true);

    try {
      if (!user) {
        Alert.alert(
          'Not signed in',
          'Sign in again to change your password.',
        );
        return;
      }

      await user.updatePassword({ newPassword: password });

      {
        Alert.alert(
          'Password updated',
          'Use your new password next time you sign in.',
          [
            {
              text: 'OK',
              onPress: () => {},
            },
          ],
        );

        Alert.alert(
          'Password updated',
          'Use your new password next time you sign in.',
          [
            {
              text: 'OK',
              onPress: () => {},
            },
          ],
        );

        setPassword('');
        setConfirm('');
      }
    } catch (err) {
      Alert.alert(
        'Could not change password',
        (err as { errors?: Array<{ message?: string }> })?.errors?.[0]
          ?.message ?? 'Try again.',
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
              paddingTop: insets.top + 10,
              paddingBottom: insets.bottom + 45,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.eyebrow}>
              ACCOUNT SECURITY
            </Text>

            <Text style={styles.title}>
              Create a stronger{'\n'}
              password.
            </Text>

            <Text style={styles.description}>
              Protect your CtrlPass account with a password
              that is unique and difficult to guess.
            </Text>
          </View>

          {/* Security visual */}
          <View style={styles.securityVisual}>
            <View style={styles.securityOuter}>
              <View style={styles.securityMiddle}>
                <View style={styles.securityInner}>
                  <Text style={styles.lockText}>
                    •
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.securityCopy}>
              <Text style={styles.securityTitle}>
                Your account stays yours
              </Text>

              <Text style={styles.securitySubtitle}>
                Never reuse your CtrlPass password on
                another service.
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                NEW PASSWORD
              </Text>

              <Field
                label=""
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Strength */}
            <View style={styles.strengthBlock}>
              <View style={styles.strengthBars}>
                {[1, 2, 3].map(level => (
                  <View
                    key={level}
                    style={[
                      styles.strengthBar,
                      strength.level >= level &&
                        styles.strengthBarActive,
                    ]}
                  />
                ))}
              </View>

              <Text
                style={[
                  styles.strengthText,
                  strength.level === 3 &&
                    styles.strengthStrong,
                ]}
              >
                {strength.label}
              </Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                CONFIRM PASSWORD
              </Text>

              <Field
                label=""
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={confirm}
                onChangeText={setConfirm}
              />
            </View>

            {confirm.length > 0 ? (
              <View
                style={[
                  styles.matchMessage,
                  matches
                    ? styles.matchSuccess
                    : styles.matchError,
                ]}
              >
                <View
                  style={[
                    styles.matchDot,
                    matches
                      ? styles.matchDotSuccess
                      : styles.matchDotError,
                  ]}
                />

                <Text
                  style={[
                    styles.matchText,
                    matches
                      ? styles.matchTextSuccess
                      : styles.matchTextError,
                  ]}
                >
                  {matches
                    ? 'Passwords match'
                    : 'Passwords do not match'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Requirements */}
          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>
              PASSWORD REQUIREMENTS
            </Text>

            <Requirement
              label="At least 8 characters"
              active={password.length >= 8}
            />

            <Requirement
              label="Use a mix of letters and numbers"
              active={
                /[A-Za-z]/.test(password) &&
                /[0-9]/.test(password)
              }
            />

            <Requirement
              label="Avoid passwords you've used elsewhere"
              active={false}
              neutral
            />
          </View>

          {/* CTA */}
          <View style={styles.cta}>
            <Button
              title="Update password"
              onPress={handleSave}
              loading={busy}
            />

            <Text style={styles.ctaHint}>
              You'll use this password the next time you
              sign in.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Requirement({
  label,
  active,
  neutral,
}: {
  label: string;
  active: boolean;
  neutral?: boolean;
}) {
  return (
    <View style={styles.requirement}>
      <View
        style={[
          styles.requirementDot,
          active && styles.requirementDotActive,
          neutral && styles.requirementDotNeutral,
        ]}
      >
        {active ? (
          <Text style={styles.check}>
            ✓
          </Text>
        ) : null}
      </View>

      <Text
        style={[
          styles.requirementText,
          active && styles.requirementTextActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
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
    paddingTop: 12,
    marginBottom: 34,
  },


  eyebrow: {
    color: colors.champagne,
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 12,
  },


  title: {
    color: '#F5F5F2',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -1.15,
  },

  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
    maxWidth: 350,
  },

  /* Security visual */

  securityVisual: {
    minHeight: 112,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1E1E1E',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 16,
  },

  securityOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  securityMiddle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(214,180,122,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  securityInner: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#171717',
    alignItems: 'center',
    justifyContent: 'center',
  },

  lockText: {
    color: colors.champagne,
    fontSize: 22,
    lineHeight: 22,
    fontWeight: '700',
  },

  securityCopy: {
    flex: 1,
    marginLeft: 17,
  },

  securityTitle: {
    color: '#EAE9E4',
    fontSize: 14,
    fontWeight: '600',
  },

  securitySubtitle: {
    color: '#68655F',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  /* Form */

  form: {
    marginBottom: 27,
  },

  fieldBlock: {
    marginBottom: 5,
  },


  fieldLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 7,
  },

  strengthBlock: {
    marginTop: 7,
    marginBottom: 21,
  },

  strengthBars: {
    flexDirection: 'row',
    gap: 5,
  },

  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#242424',
  },

  strengthBarActive: {
    backgroundColor: colors.champagne,
  },

  strengthText: {
    color: '#5E5B56',
    fontSize: 10,
    marginTop: 7,
  },

  strengthStrong: {
    color: colors.champagne,
  },

  matchMessage: {
    minHeight: 38,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  matchSuccess: {
    backgroundColor: 'rgba(127,191,154,0.07)',
  },

  matchError: {
    backgroundColor: 'rgba(217,107,107,0.07)',
  },

  matchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 9,
  },

  matchDotSuccess: {
    backgroundColor: colors.success,
  },

  matchDotError: {
    backgroundColor: colors.error,
  },

  matchText: {
    fontSize: 11,
    fontWeight: '500',
  },

  matchTextSuccess: {
    color: colors.success,
  },

  matchTextError: {
    color: colors.error,
  },

  /* Requirements */

  requirements: {
    paddingTop: 20,
    paddingBottom: 21,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1D1D1D',
  },


  requirementsTitle: {
    color: '#5F5C57',
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 14,
  },

  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 29,
  },

  requirementDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#303030',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  requirementDotActive: {
    backgroundColor: 'rgba(127,191,154,0.12)',
    borderColor: 'rgba(127,191,154,0.35)',
  },

  requirementDotNeutral: {
    borderColor: '#242424',
  },

  check: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '700',
  },

  requirementText: {
    color: '#68655F',
    fontSize: 12,
  },

  requirementTextActive: {
    color: '#B5B2AB',
  },

  /* CTA */

  cta: {
    marginTop: 28,
  },

  ctaHint: {
    color: '#55524D',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 30,
  },
});