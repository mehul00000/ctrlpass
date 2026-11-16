import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingState } from '../../components';
import { PrimaryButton } from '../../components/cinema';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/events';
import { RegistrationField } from '../../types';
import { AttendeeStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<
  AttendeeStackParamList,
  'AttendeeDetails'
>;

export default function AttendeeDetailsScreen({
  route,
  navigation,
}: Props) {
  const {
    eventId,
    ticketTypeId,
    quantity,
  } = route.params;

  const { profile, session } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(
    profile?.full_name ?? '',
  );
  const [email, setEmail] = useState(
    session?.user?.email ?? '',
  );
  const [phone, setPhone] = useState(
    profile?.phone ?? '',
  );

  const [extraFields, setExtraFields] =
    useState<Record<string, string>>({});

  const [registrationFields, setRegistrationFields] =
    useState<RegistrationField[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadFields = async () => {
      try {
        const fields =
          await eventService.getRegistrationFields(
            eventId,
          );

        if (mounted) {
          setRegistrationFields(fields);
        }
      } catch {
        if (mounted) {
          setRegistrationFields([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadFields();

    return () => {
      mounted = false;
    };
  }, [eventId]);

  const requiredFields = useMemo(
    () =>
      registrationFields.filter(
        field => field.required,
      ),
    [registrationFields],
  );

  const filledRequiredCount = useMemo(
    () =>
      requiredFields.filter(field =>
        extraFields[field.field_key]?.trim(),
      ).length,
    [requiredFields, extraFields],
  );

  const isBaseFormValid =
    name.trim().length > 0 &&
    email.trim().includes('@') &&
    phone.trim().length > 0;

  const isCustomFormValid =
    filledRequiredCount === requiredFields.length;

  const canContinue =
    isBaseFormValid &&
    isCustomFormValid &&
    !submitting;

  const handleExtraFieldChange = (
    key: string,
    value: string,
  ) => {
    setExtraFields(previous => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleProceed = () => {
    if (!name.trim()) {
      Alert.alert(
        'Full name required',
        'Please enter the attendee’s full name.',
      );
      return;
    }

    if (
      !email.trim() ||
      !email.includes('@')
    ) {
      Alert.alert(
        'Valid email required',
        'Please enter a valid email address.',
      );
      return;
    }

    if (!phone.trim()) {
      Alert.alert(
        'Mobile number required',
        'Please enter your mobile number.',
      );
      return;
    }

    for (const field of registrationFields) {
      if (
        field.required &&
        !extraFields[field.field_key]?.trim()
      ) {
        Alert.alert(
          'Required information',
          `Please fill in: ${field.label}`,
        );
        return;
      }
    }

    setSubmitting(true);

    navigation.navigate('OrderSummary', {
      eventId,
      ticketTypeId,
      quantity,
      attendeeName: name.trim(),
      attendeeEmail: email.trim(),
      attendeePhone: phone.trim(),
      extraFields,
    });

    setSubmitting(false);
  };

  if (loading) {
    return (
      <LoadingState message="Loading registration form..." />
    );
  }

  return (
    <View style={s.container}>
      <SafeAreaView
        edges={['top']}
        style={s.safeArea}
      >
        <KeyboardAvoidingView
          style={s.flex}
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
              s.content,
              {
                paddingBottom:
                  150 + insets.bottom,
              },
            ]}
          >
            {/* ---------------------------------------------------
                HEADER
            --------------------------------------------------- */}

            <View style={s.header}>
              <View style={s.stepRow}>
                <View style={s.stepActive}>
                  <Text style={s.stepActiveText}>
                    2
                  </Text>
                </View>

                <Text style={s.stepLabel}>
                  ATTENDEE DETAILS
                </Text>
              </View>

              <Text style={s.title}>
                Tell us who’s coming.
              </Text>

              <Text style={s.subtitle}>
                These details are used for your booking,
                ticket delivery and entry verification.
              </Text>
            </View>

            {/* ---------------------------------------------------
                CONTACT INFORMATION
            --------------------------------------------------- */}

            <View style={s.section}>
              <View style={s.sectionHeading}>
                <Text style={s.sectionEyebrow}>
                  CONTACT
                </Text>

                <Text style={s.sectionTitle}>
                  Your details
                </Text>
              </View>

              <View style={s.formCard}>
                <PremiumField
                  label="FULL NAME"
                  value={name}
                  placeholder="Your full name"
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                <FieldDivider />

                <PremiumField
                  label="EMAIL ADDRESS"
                  value={email}
                  placeholder="you@example.com"
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                <FieldDivider />

                <PremiumField
                  label="MOBILE NUMBER"
                  value={phone}
                  placeholder="+91 98765 43210"
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  returnKeyType="done"
                />
              </View>

              <View style={s.secureNote}>
                <View style={s.secureIcon}>
                  <Text style={s.secureIconText}>
                    ✓
                  </Text>
                </View>

                <Text style={s.secureText}>
                  Your information is only shared where
                  required to fulfil this booking.
                </Text>
              </View>
            </View>

            {/* ---------------------------------------------------
                EVENT FIELDS
            --------------------------------------------------- */}

            {registrationFields.length > 0 ? (
              <View style={s.section}>
                <View style={s.sectionHeading}>
                  <View>
                    <Text style={s.sectionEyebrow}>
                      EVENT
                    </Text>

                    <Text style={s.sectionTitle}>
                      Additional details
                    </Text>
                  </View>

                  {requiredFields.length > 0 ? (
                    <Text style={s.completion}>
                      {filledRequiredCount}/
                      {requiredFields.length}
                    </Text>
                  ) : null}
                </View>

                <View style={s.formCard}>
                  {registrationFields.map(
                    (field, index) => (
                      <React.Fragment key={field.id}>
                        {index > 0 ? (
                          <FieldDivider />
                        ) : null}

                        {field.options?.length ? (
                          <RadioGroup
                            value={
                              extraFields[
                                field.field_key
                              ] ?? ''
                            }
                            onValueChange={value =>
                              handleExtraFieldChange(
                                field.field_key,
                                value,
                              )
                            }
                          >
                            {field.options.map(
                              option => (
                                <RadioGroupItem
                                  key={option}
                                  value={option}
                                  label={option}
                                />
                              ),
                            )}
                          </RadioGroup>
                        ) : (
                          <PremiumField
                            label={`${field.label}${
                              field.required
                                ? ' (required)'
                                : ''
                            }`}
                            value={
                              extraFields[
                                field.field_key
                              ] ?? ''
                            }
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            onChangeText={value =>
                              handleExtraFieldChange(
                                field.field_key,
                                value,
                              )
                            }
                          />
                        )}
                      </React.Fragment>
                    ),
                  )}
                </View>
              </View>
            ) : null}

            {/* ---------------------------------------------------
                BOOKING SUMMARY MICRO CARD
            --------------------------------------------------- */}

            <View style={s.summaryCard}>
              <View style={s.summaryIcon}>
                <View style={s.ticketShape}>
                  <View style={s.ticketLine} />
                </View>
              </View>

              <View style={s.summaryCopy}>
                <Text style={s.summaryTitle}>
                  Almost there
                </Text>

                <Text style={s.summaryText}>
                  Review your order next, then continue
                  to secure your passes.
                </Text>
              </View>
            </View>

            {/* ---------------------------------------------------
                FOOTER
            --------------------------------------------------- */}

            <View style={s.footer}>
              <View style={s.footerLine} />

              <Text style={s.footerText}>
                CTRL PASS
              </Text>

              <View style={s.footerLine} />
            </View>
          </ScrollView>

          {/* -----------------------------------------------------
              STICKY CTA
          ----------------------------------------------------- */}

          <View
            style={[
              s.bottomBar,
              {
                paddingBottom:
                  Math.max(insets.bottom + 8, 18),
              },
            ]}
          >
            <View style={s.bottomCopy}>
              <Text style={s.bottomEyebrow}>
                STEP 2 OF 2
              </Text>

              <Text style={s.bottomTitle}>
                Review your order
              </Text>
            </View>

            <PrimaryButton
              title={
                submitting
                  ? 'Continuing...'
                  : 'Review Order'
              }
              disabled={!canContinue}
              onPress={handleProceed}
              style={s.continueButton}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

/* =================================================================
   PREMIUM FIELD
================================================================= */

type PremiumFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  returnKeyType?: 'done' | 'next';
};

function PremiumField({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = false,
  returnKeyType = 'next',
}: PremiumFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>
        {label}
      </Text>

      <View
        style={[
          s.inputShell,
          focused && s.inputShellFocused,
        ]}
      >
        <TextInputCompat
          value={value}
          placeholder={placeholder}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          placeholderTextColor="#595650"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

/*
 * Kept as a tiny wrapper so the visual field implementation remains
 * isolated from the screen layout.
 */
import {
  TextInput,
} from 'react-native';
import { RadioGroup, RadioGroupItem } from '../../components/radio';

function TextInputCompat(
  props: React.ComponentProps<typeof TextInput>,
) {
  return (
    <TextInput
      {...props}
      style={s.input}
      selectionColor={colors.champagne}
      cursorColor={colors.champagne}
    />
  );
}

function FieldDivider() {
  return <View style={s.divider} />;
}

/* =================================================================
   STYLES
================================================================= */

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },

  safeArea: {
    flex: 1,
  },

  flex: {
    flex: 1,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  /* ---------------------------------------------------------------
     HEADER
  --------------------------------------------------------------- */

  header: {
    paddingBottom: 29,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 17,
  },

  stepActive: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: colors.champagne,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepActiveText: {
    color: '#080808',
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },


  stepLabel: {
    color: 'rgba(214,180,122,0.72)',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },


  title: {
    color: colors.textPrimary,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.9,
  },

  subtitle: {
    maxWidth: 350,
    color: '#79756E',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 9,
  },

  /* ---------------------------------------------------------------
     SECTIONS
  --------------------------------------------------------------- */

  section: {
    marginBottom: 28,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },


  sectionEyebrow: {
    color: 'rgba(214,180,122,0.68)',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 5,
  },


  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.4,
  },

  completion: {
    color: '#65615B',
    fontSize: 10,
    paddingBottom: 3,
  },

  /* ---------------------------------------------------------------
     FORM CARD
  --------------------------------------------------------------- */

  formCard: {
    borderRadius: 22,
    backgroundColor: '#141414',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
  },

  field: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },


  fieldLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
        marginBottom: 7,
  },

  inputShell: {
    minHeight: 39,
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#101010',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.055)',
  },

  inputShellFocused: {
    borderColor: 'rgba(214,180,122,0.38)',
    backgroundColor: '#121211',
  },

  input: {
    minHeight: 39,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.065)',
  },

  /* ---------------------------------------------------------------
     SECURITY NOTE
  --------------------------------------------------------------- */

  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 3,
    marginTop: 9,
  },

  secureIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(127,191,154,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(127,191,154,0.20)',
  },

  secureIconText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
  },

  secureText: {
    flex: 1,
    color: '#62605A',
    fontSize: 9,
    lineHeight: 14,
  },

  optionsHint: {
    color: '#55514C',
    fontSize: 9,
    lineHeight: 14,
    marginHorizontal: 16,
    marginTop: -6,
    marginBottom: 8,
  },

  /* ---------------------------------------------------------------
     SUMMARY
  --------------------------------------------------------------- */

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#111111',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(214,180,122,0.13)',
  },

  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(214,180,122,0.08)',
  },

  ticketShape: {
    width: 20,
    height: 15,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.62)',
    justifyContent: 'center',
  },

  ticketLine: {
    width: 10,
    height: 1,
    alignSelf: 'center',
    backgroundColor: 'rgba(214,180,122,0.42)',
  },

  summaryCopy: {
    flex: 1,
  },

  summaryTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
  },

  summaryText: {
    color: '#66625C',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  /* ---------------------------------------------------------------
     FOOTER
  --------------------------------------------------------------- */

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 38,
  },

  footerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },


  footerText: {
    color: '#484540',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },

  /* ---------------------------------------------------------------
     STICKY CTA
  --------------------------------------------------------------- */

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    backgroundColor:
      Platform.OS === 'ios'
        ? 'rgba(5,5,5,0.94)'
        : 'rgba(5,5,5,0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.09)',
  },

  bottomCopy: {
    flex: 1,
    minWidth: 0,
  },


  bottomEyebrow: {
    color: '#5E5A54',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
      },

  bottomTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 3,
  },

  continueButton: {
    minWidth: 142,
  },
});