import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useAuth } from '../../hooks/useAuth';
import { profileService } from '../../services/profile';

const CITY_OPTIONS = [
  'Delhi-NCR',
  'Mumbai',
  'Bengaluru',
  'Goa',
  'Hyderabad',
  'Pune',
];

export default function ProfileSetupScreen() {
  const { session, refresh } = useAuth();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert(
        'Name required',
        'Please enter your full name.',
      );
      return;
    }

    if (!session?.user?.id) return;

    setLoading(true);

    try {
      await profileService.upsertProfile(
        session.user.id,
        {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          city: city.trim() || null,
        },
      );

      await refresh();
    } catch (err: any) {
      Alert.alert(
        'Could not save profile',
        err?.message ??
          'Failed to update your profile.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
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
              paddingBottom:
                150 + insets.bottom,
            },
          ]}
        >
          {/* Identity header */}

          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {fullName.trim()
                  ? fullName
                      .trim()
                      .charAt(0)
                      .toUpperCase()
                  : 'C'}
              </Text>
            </View>

            <Text style={styles.kicker}>
              YOUR PROFILE
            </Text>

            <Text style={styles.title}>
              Make your pass{'\n'}personal.
            </Text>

            <Text style={styles.subtitle}>
              These details help us issue tickets
              correctly and verify your identity at
              the gate.
            </Text>
          </View>

          {/* Required information */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>
              ESSENTIAL DETAILS
            </Text>

            <Text style={styles.sectionHint}>
              Required for ticket issuance
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.field}>
              <Input
                label="Full name"
                placeholder="Your full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                returnKeyType="next"
                success={fullName.trim().length > 1}
              />
            </View>

            <View style={styles.fieldDivider} />

            <View style={styles.field}>
              <Input
                label="Phone number"
                placeholder="+91 98765 43210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Select
                value={city}
                onValueChange={(value) =>
                  setCity(value === 'Other' ? '' : value)
                }
              >
                <SelectTrigger
                  accessibilityLabel="City"
                >
                  <SelectValue placeholder="Where are you based?" />
                </SelectTrigger>

                <SelectContent>
                  {CITY_OPTIONS.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                    >
                      {option}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">
                    Other
                  </SelectItem>
                </SelectContent>
              </Select>
            </View>
          </View>

          {/* Why we ask */}

          <View style={styles.infoBlock}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>
                i
              </Text>
            </View>

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>
                Why do we need this?
              </Text>

              <Text style={styles.infoText}>
                Your name is used on your ticket and
                during gate verification. Phone and
                city help keep your account and
                event experience connected.
              </Text>
            </View>
          </View>

          {/* Privacy note */}

          <View style={styles.privacyRow}>
            <View style={styles.lock}>
              <Text style={styles.lockText}>
                ✓
              </Text>
            </View>

            <Text style={styles.privacyText}>
              Your information stays tied to your
              CtrlPass account and is only used for
              the service.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom action */}

        <View
          style={[
            styles.footer,
            {
              paddingBottom:
                Math.max(insets.bottom, 10),
            },
          ]}
        >
          <View style={styles.footerStatus}>
            <View
              style={[
                styles.statusDot,
                fullName.trim() &&
                  styles.statusDotActive,
              ]}
            />

            <Text style={styles.statusText}>
              {fullName.trim()
                ? 'Ready to continue'
                : 'Full name is required'}
            </Text>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={
              loading || !fullName.trim()
            }
            accessibilityRole="button"
            accessibilityLabel="Save profile and continue"
            style={({ pressed }) => [
              styles.continueButton,
              (!fullName.trim() || loading) &&
                styles.disabledButton,
              pressed &&
                fullName.trim() &&
                !loading &&
                styles.pressed,
            ]}
          >
            <Text style={styles.continueText}>
              {loading
                ? 'Saving…'
                : 'Save & Continue'}
            </Text>

            {!loading && fullName.trim() ? (
              <Text style={styles.arrow}>
                →
              </Text>
            ) : null}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/*
 * to keep the screen structure easy to scan.
 */
import { Input } from '../../components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/select';
import { colors } from '../../theme';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 24,
  },

  /* Header */

  header: {
    paddingTop: 6,
    paddingBottom: 37,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#12110F',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },

  avatarText: {
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
    fontSize: 37,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -1.5,
  },

  subtitle: {
    color: '#85817A',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 15,
    maxWidth: 350,
  },

  /* Section */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },


  sectionEyebrow: {
    color: '#66625C',
    fontSize: 11,
    fontWeight: '700',
      },

  sectionHint: {
    color: '#4F4C47',
    fontSize: 9,
  },

  /* Form */

  formCard: {
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: '#22211F',
    borderRadius: 21,
    paddingHorizontal: 16,
  },

  field: {
    paddingVertical: 15,
  },


  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 8,
  },

  inputWrap: {
    minHeight: 42,
    justifyContent: 'center',
  },

  input: {
    color: '#F2F0EA',
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },

  fieldDivider: {
    height: 1,
    backgroundColor: '#1D1D1B',
  },

  /* Info */

  infoBlock: {
    marginTop: 24,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#20201E',
    flexDirection: 'row',
  },

  infoIcon: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor: 'rgba(214,180,122,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoIconText: {
    color: '#D6B47A',
    fontSize: 12,
    fontWeight: '700',
  },

  infoCopy: {
    flex: 1,
    marginLeft: 11,
  },

  infoTitle: {
    color: '#D8D5CE',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 5,
  },

  infoText: {
    color: '#6E6A64',
    fontSize: 10,
    lineHeight: 16,
  },

  /* Privacy */

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 17,
    paddingHorizontal: 3,
  },

  lock: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: 'rgba(127,191,154,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(127,191,154,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  lockText: {
    color: '#7FBF9A',
    fontSize: 10,
    fontWeight: '800',
  },

  privacyText: {
    flex: 1,
    color: '#55514B',
    fontSize: 9,
    lineHeight: 14,
  },

  /* Footer */

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 11,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(5,5,5,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#1A1A18',
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

  statusText: {
    color: '#625E58',
    fontSize: 9,
  },

  continueButton: {
    height: 53,
    borderRadius: 16,
    backgroundColor: '#E8E3D9',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  disabledButton: {
    backgroundColor: '#1A1917',
    opacity: 0.75,
  },

  continueText: {
    color: '#090909',
    fontSize: 13,
    fontWeight: '700',
  },

  arrow: {
    color: '#090909',
    fontSize: 17,
    marginLeft: 9,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
});