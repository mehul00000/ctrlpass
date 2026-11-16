import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useClerk, useOAuth, useSignIn, useSignUp } from '@clerk/expo';

import { Field } from '../../components';
import { colors } from '../../theme';

type AuthStep = 'phone' | 'otp' | 'email' | 'emailCode' | 'resetCode';

/** True when Clerk does not know the identifier (account does not exist yet). */
function isIdentifierNotFound(err: unknown): boolean {
  return (
    (err as { errors?: Array<{ code?: string }> })?.errors?.[0]?.code ===
    'form_identifier_not_found'
  );
}

function CtrlPassMark() {
  return (
    <View style={styles.markWrap}>
      <View style={styles.markOuter}>
        <View style={styles.markInner}>
          <Text style={styles.markText}>C</Text>
        </View>
      </View>
    </View>
  );
}

function AuthBackdrop() {
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      <Svg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient
            id="authLine"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <Stop
              offset="0"
              stopColor="#D6B47A"
              stopOpacity="0"
            />
            <Stop
              offset="0.5"
              stopColor="#D6B47A"
              stopOpacity="0.10"
            />
            <Stop
              offset="1"
              stopColor="#D6B47A"
              stopOpacity="0"
            />
          </LinearGradient>
        </Defs>

        <Circle
          cx="8%"
          cy="4%"
          r="170"
          fill="#D6B47A"
          opacity={0.035}
        />

        <Circle
          cx="92%"
          cy="90%"
          r="190"
          fill="#FFFFFF"
          opacity={0.018}
        />

        <Path
          d="M-80 610 C120 500 250 560 430 650 C620 745 820 720 1080 570"
          stroke="url(#authLine)"
          strokeWidth={1}
          fill="none"
        />

        <Path
          d="M-120 660 C100 555 280 610 455 690 C650 780 850 745 1120 600"
          stroke="#D6B47A"
          strokeOpacity={0.035}
          strokeWidth={1}
          fill="none"
        />
      </Svg>
    </View>
  );
}

function Divider() {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>OR</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

function BackButton({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.backButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.backIcon}>‹</Text>
      <Text style={styles.backText}>Back</Text>
    </Pressable>
  );
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const clerk = useClerk();
  const { signIn: signInClient } = useSignIn();
  const { signUp: signUpClient } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  /** Whether the OTP step verifies an existing account or a new sign-up. */
  const [otpMode, setOtpMode] = useState<'signIn' | 'signUp'>('signIn');

  const [emailMode, setEmailMode] = useState<
    'signIn' | 'signUp' | 'forgot'
  >('signIn');

  const fadeAnim = useRef(
    new Animated.Value(1),
  ).current;

  const otpRefs = useRef<
    Array<{ focus: () => void } | null>
  >([]);

  function animateStep(next: AuthStep) {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 110,
      useNativeDriver: true,
    }).start(() => {
      setStep(next);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 190,
        useNativeDriver: true,
      }).start();
    });
  }

  function fullPhone() {
    const cleaned = phone.replace(/\D/g, '');

    return cleaned.startsWith('91')
      ? `+${cleaned}`
      : `+91${cleaned}`;
  }

  async function activate(clerkSessionId: string | null | undefined) {
    if (!clerkSessionId) return;
    await clerk.setActive({ session: clerkSessionId });
  }

  /** Maps a ClerkError (thrown or returned) to its first error code/message. */
  function clerkErrorMessage(err: unknown): { code?: string; message?: string } | null {
    const e = err as { errors?: Array<{ code?: string; message?: string; longMessage?: string }> };
    if (e?.errors?.[0]) {
      return { code: e.errors[0].code, message: e.errors[0].longMessage ?? e.errors[0].message };
    }
    return null;
  }

  async function handleSendOtp() {
    const digits = phone.replace(/\D/g, '');

    if (digits.length < 10) {
      Alert.alert(
        'Invalid number',
        'Enter a valid 10-digit mobile number.',
      );
      return;
    }

    setBusy(true);

    try {
      // Existing account -> SMS sign-in; unknown number -> SMS sign-up.
      let mode: 'signIn' | 'signUp' = 'signIn';

      try {
        const created = await signInClient.create({
          identifier: fullPhone(),
        });

        if (created.error) {
          throw created.error;
        }

        const sent = await signInClient.phoneCode.sendCode();
        if (sent.error) throw sent.error;
      } catch (err) {
        if (!isIdentifierNotFound(err)) throw err;

        const created = await signUpClient.create({
          phoneNumber: fullPhone(),
        });
        if (created.error) throw created.error;

        const sent = await signUpClient.verifications.sendPhoneCode();
        if (sent.error) throw sent.error;

        mode = 'signUp';
      }

      setOtpMode(mode);
      animateStep('otp');
    } catch (err) {
      Alert.alert(
        'Could not send OTP',
        clerkErrorMessage(err)?.message ??
          'Check the number and try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp() {
    const code = otp.join('');

    if (code.length < 6) {
      Alert.alert(
        'Incomplete OTP',
        'Enter the full 6-digit OTP.',
      );
      return;
    }

    setBusy(true);

    try {
      if (otpMode === 'signIn') {
        const verified = await signInClient.phoneCode.verifyCode({ code });
        if (verified.error) throw verified.error;

        await activate(signInClient.createdSessionId);
      } else {
        const verified =
          await signUpClient.verifications.verifyPhoneCode({ code });
        if (verified.error) throw verified.error;

        await activate(signUpClient.createdSessionId);
      }
    } catch (err) {
      Alert.alert(
        'Verification failed',
        clerkErrorMessage(err)?.message ?? 'Invalid or expired code.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleResendOtp() {
    setBusy(true);

    try {
      const result =
        otpMode === 'signIn'
          ? await signInClient.phoneCode.sendCode()
          : await signUpClient.verifications.sendPhoneCode();

      if (result.error) throw result.error;
    } catch (err) {
      Alert.alert(
        'Could not resend',
        clerkErrorMessage(err)?.message ?? 'Try again in a moment.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailSubmit() {
    if (!email.trim()) {
      Alert.alert(
        'Email required',
        'Enter your email address.',
      );
      return;
    }

    if (
      emailMode !== 'forgot' &&
      password.length < 8
    ) {
      Alert.alert(
        'Password too short',
        'Password must be at least 8 characters.',
      );
      return;
    }

    setBusy(true);

    try {
      if (emailMode === 'signIn') {
        const created = await signInClient.create({
          identifier: email.trim(),
        });
        if (created.error) throw created.error;

        const attempt = await signInClient.password({ password });
        if (attempt.error) throw attempt.error;

        await activate(signInClient.createdSessionId);
      } else if (emailMode === 'signUp') {
        const created = await signUpClient.create({
          emailAddress: email.trim(),
          password,
        });
        if (created.error) throw created.error;

        const sent = await signUpClient.verifications.sendEmailCode();
        if (sent.error) throw sent.error;

        animateStep('emailCode');
      } else {
        const created = await signInClient.create({
          identifier: email.trim(),
        });
        if (created.error) throw created.error;

        const sent = await signInClient.resetPasswordEmailCode.sendCode();
        if (sent.error) throw sent.error;

        animateStep('resetCode');
      }
    } catch (err) {
      Alert.alert(
        emailMode === 'signIn'
          ? 'Sign in failed'
          : emailMode === 'signUp'
            ? 'Sign up failed'
            : 'Could not send reset code',
        clerkErrorMessage(err)?.message ??
          'Check your details and try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailCodeSubmit() {
    const code = otp.join('');

    if (code.length < 6) {
      Alert.alert(
        'Incomplete code',
        'Enter the full 6-digit code.',
      );
      return;
    }

    setBusy(true);

    try {
      const verified = await signUpClient.verifications.verifyEmailCode({
        code,
      });
      if (verified.error) throw verified.error;

      await activate(signUpClient.createdSessionId);
    } catch (err) {
      Alert.alert(
        'Verification failed',
        clerkErrorMessage(err)?.message ?? 'Invalid or expired code.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleResetSubmit() {
    const code = otp.join('');

    if (code.length < 6) {
      Alert.alert(
        'Incomplete code',
        'Enter the full 6-digit code.',
      );
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        'Password too short',
        'Password must be at least 8 characters.',
      );
      return;
    }

    setBusy(true);

    try {
      const verified = await signInClient.resetPasswordEmailCode.verifyCode({
        code,
      });
      if (verified.error) throw verified.error;

      const submitted =
        await signInClient.resetPasswordEmailCode.submitPassword({
          password: newPassword,
        });
      if (submitted.error) throw submitted.error;

      await activate(signInClient.createdSessionId);
    } catch (err) {
      Alert.alert(
        'Reset failed',
        clerkErrorMessage(err)?.message ?? 'Invalid or expired code.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);

    try {
      const result = await startOAuthFlow({
        redirectUrl: Linking.createURL('/oauth-native-callback'),
      });

      if (result.authSessionResult?.type === 'cancel') {
        return;
      }

      if (result.createdSessionId) {
        await clerk.setActive({ session: result.createdSessionId });
        return;
      }

      // First-time Google accounts land in a sign-up that may still need
      // verification. Social sign-ups are pre-verified, so treat anything
      // else as a failure rather than faking success.
      if (result.signUp?.createdSessionId) {
        await clerk.setActive({ session: result.signUp.createdSessionId });
        return;
      }

      Alert.alert(
        'Google sign-in incomplete',
        'Google did not return a session. Try again.',
      );
    } catch (err) {
      Alert.alert(
        'Google sign-in failed',
        clerkErrorMessage(err)?.message ?? 'Check your connection and try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  function handleOtpChange(
    text: string,
    index: number,
  ) {
    const digits = text
      .replace(/\D/g, '')
      .slice(-1);

    const next = [...otp];
    next[index] = digits;
    setOtp(next);

    if (digits && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (!digits && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  const renderPhone = () => (
    <View>
      <Text style={styles.kicker}>
        WELCOME TO CTRLPASS
      </Text>

      <Text style={styles.title}>
        Find your{'\n'}next experience.
      </Text>

      <Text style={styles.subtitle}>
        Sign in with your mobile number and get
        straight to the events worth going to.
      </Text>

      <View style={styles.phoneRow}>
        <View style={styles.countryCode}>
          <Text style={styles.countryText}>
            +91
          </Text>
        </View>

        <TextInput
          style={styles.phoneInput}
          placeholder="Mobile number"
          placeholderTextColor="#5F5B55"
          keyboardType="phone-pad"
          maxLength={12}
          value={phone}
          onChangeText={setPhone}
          onSubmitEditing={handleSendOtp}
          returnKeyType="done"
        />
      </View>

      <Pressable
        onPress={handleSendOtp}
        disabled={busy}
        style={({ pressed }) => [
          styles.primaryAction,
          busy && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.primaryActionText}>
          {busy ? 'Sending…' : 'Continue'}
        </Text>

        {!busy && (
          <Text style={styles.actionArrow}>→</Text>
        )}
      </Pressable>

      <Divider />

      <Pressable
        onPress={() => animateStep('email')}
        style={({ pressed }) => [
          styles.secondaryAction,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.secondaryActionText}>
          Continue with Email
        </Text>
      </Pressable>

      <Pressable
        onPress={handleGoogle}
        disabled={busy}
        style={({ pressed }) => [
          styles.secondaryAction,
          busy && styles.disabled,
          pressed && styles.pressed,
          { marginTop: 10 },
        ]}
      >
        <Text style={styles.secondaryActionText}>
          Continue with Google
        </Text>
      </Pressable>

    </View>
  );

  const renderOtp = () => (
    <View>
      <BackButton
        onPress={() => animateStep('phone')}
      />

      <Text style={styles.kicker}>
        VERIFICATION
      </Text>

      <Text style={styles.title}>
        Enter the{'\n'}code we sent.
      </Text>

      <Text style={styles.subtitle}>
        We sent a 6-digit verification code to
        {'\n'}
        <Text style={styles.phoneHighlight}>
          +91 {phone.replace(/\D/g, '').slice(-10)}
        </Text>
      </Text>

      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => {
              otpRefs.current[index] = ref;
            }}
            style={[
              styles.otpBox,
              digit && styles.otpBoxFilled,
            ]}
            value={digit}
            onChangeText={text =>
              handleOtpChange(text, index)
            }
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            textContentType="oneTimeCode"
          />
        ))}
      </View>

      <Pressable
        onPress={handleVerifyOtp}
        disabled={busy}
        style={({ pressed }) => [
          styles.primaryAction,
          busy && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.primaryActionText}>
          {busy
            ? 'Verifying…'
            : 'Verify & Continue'}
        </Text>

        {!busy && (
          <Text style={styles.actionArrow}>→</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.resendButton}
        onPress={handleResendOtp}
        disabled={busy}
      >
        <Text style={styles.resendText}>
          Didn't receive it?{' '}
          <Text style={styles.resendAccent}>
            Resend OTP
          </Text>
        </Text>
      </Pressable>
    </View>
  );

  const renderEmailCode = () => (
    <View>
      <BackButton
        onPress={() => animateStep('email')}
      />

      <Text style={styles.kicker}>
        VERIFY YOUR EMAIL
      </Text>

      <Text style={styles.title}>
        Confirm it's{'\n'}really you.
      </Text>

      <Text style={styles.subtitle}>
        We sent a 6-digit verification code to{'\n'}
        <Text style={styles.phoneHighlight}>{email.trim()}</Text>
      </Text>

      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => {
              otpRefs.current[index] = ref;
            }}
            style={[
              styles.otpBox,
              digit && styles.otpBoxFilled,
            ]}
            value={digit}
            onChangeText={text =>
              handleOtpChange(text, index)
            }
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            textContentType="oneTimeCode"
          />
        ))}
      </View>

      <Pressable
        onPress={handleEmailCodeSubmit}
        disabled={busy}
        style={({ pressed }) => [
          styles.primaryAction,
          busy && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.primaryActionText}>
          {busy ? 'Verifying…' : 'Verify & Continue'}
        </Text>

        {!busy && (
          <Text style={styles.actionArrow}>→</Text>
        )}
      </Pressable>
    </View>
  );

  const renderResetCode = () => (
    <View>
      <BackButton
        onPress={() => animateStep('email')}
      />

      <Text style={styles.kicker}>
        ACCOUNT RECOVERY
      </Text>

      <Text style={styles.title}>
        Choose a{'\n'}new password.
      </Text>

      <Text style={styles.subtitle}>
        Enter the 6-digit code we sent to{'\n'}
        <Text style={styles.phoneHighlight}>{email.trim()}</Text>
      </Text>

      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => {
              otpRefs.current[index] = ref;
            }}
            style={[
              styles.otpBox,
              digit && styles.otpBoxFilled,
            ]}
            value={digit}
            onChangeText={text =>
              handleOtpChange(text, index)
            }
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            textContentType="oneTimeCode"
          />
        ))}
      </View>

      <View style={styles.fieldGroup}>
        <Field
          label="New password"
          placeholder="Minimum 8 characters"
          secureTextEntry
          autoCapitalize="none"
          value={newPassword}
          onChangeText={setNewPassword}
          style={{ height: 54 }}
        />
      </View>

      <Pressable
        onPress={handleResetSubmit}
        disabled={busy}
        style={({ pressed }) => [
          styles.primaryAction,
          busy && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.primaryActionText}>
          {busy ? 'Saving…' : 'Reset & Sign In'}
        </Text>

        {!busy && (
          <Text style={styles.actionArrow}>→</Text>
        )}
      </Pressable>
    </View>
  );

  const renderEmail = () => (
    <View>
      <BackButton
        onPress={() => animateStep('phone')}
      />

      <Text style={styles.kicker}>
        {emailMode === 'signUp'
          ? 'NEW ACCOUNT'
          : emailMode === 'forgot'
            ? 'ACCOUNT RECOVERY'
            : 'EMAIL SIGN IN'}
      </Text>

      <Text style={styles.title}>
        {emailMode === 'signUp'
          ? 'Create your\nCtrlPass account.'
          : emailMode === 'forgot'
            ? 'Reset your\npassword.'
            : 'Welcome\nback.'}
      </Text>

      <Text style={styles.subtitle}>
        {emailMode === 'signUp'
          ? 'One account for discovering, booking and managing your experiences.'
          : emailMode === 'forgot'
            ? 'Enter your email and we’ll send you a secure reset code.'
            : 'Sign in to access your tickets, bookings and saved experiences.'}
      </Text>

      <View style={styles.fieldGroup}>
        <Field
          label="Email"
          placeholder="you@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={{ height: 54 }}
        />

        {emailMode !== 'forgot' && (
          <Field
            label="Password"
            placeholder="Minimum 8 characters"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            style={{ height: 54 }}
          />
        )}
      </View>

      <Pressable
        onPress={handleEmailSubmit}
        disabled={busy}
        style={({ pressed }) => [
          styles.primaryAction,
          busy && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.primaryActionText}>
          {busy
            ? 'Please wait…'
            : emailMode === 'signIn'
              ? 'Sign In'
              : emailMode === 'signUp'
                ? 'Create Account'
                : 'Send Reset Email'}
        </Text>

        {!busy && (
          <Text style={styles.actionArrow}>→</Text>
        )}
      </Pressable>

      {emailMode === 'signIn' ? (
        <View style={styles.emailLinks}>
          <Pressable
            onPress={() =>
              setEmailMode('signUp')
            }
          >
            <Text style={styles.linkText}>
              Don't have an account?{' '}
              <Text style={styles.linkAccent}>
                Sign up
              </Text>
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setEmailMode('forgot')
            }
          >
            <Text style={styles.linkText}>
              Forgot password?
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() =>
            setEmailMode('signIn')
          }
          style={styles.emailLinks}
        >
          <Text style={styles.linkText}>
            ← Back to sign in
          </Text>
        </Pressable>
      )}

      <Divider />

      <Pressable
        onPress={() => animateStep('phone')}
        style={({ pressed }) => [
          styles.secondaryAction,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.secondaryActionText}>
          Sign in with Mobile
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <AuthBackdrop />

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
            styles.scrollContent,
            {
              paddingTop: Math.max(
                insets.top,
                18,
              ),
              paddingBottom:
                Math.max(insets.bottom, 18) + 20,
            },
          ]}
        >
          {/* Brand */}

          <View style={styles.header}>
            <CtrlPassMark />

            <View>
              <Text style={styles.brand}>
                CTRLPASS
              </Text>
              <Text style={styles.brandSub}>
                EXPERIENCES WORTH REMEMBERING
              </Text>
            </View>
          </View>

          <Animated.View
            style={[
              styles.formArea,
              { opacity: fadeAnim },
            ]}
          >
            {step === 'phone' && renderPhone()}
            {step === 'otp' && renderOtp()}
            {step === 'email' && renderEmail()}
            {step === 'emailCode' && renderEmailCode()}
            {step === 'resetCode' && renderResetCode()}
          </Animated.View>

          {/* Footer */}

          <View style={styles.footer}>
            <View style={styles.footerLine} />

            <Text style={styles.legalFooter}>
              By continuing, you agree to the{' '}
              <Text style={styles.legalAccent}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={styles.legalAccent}>
                Privacy Policy
              </Text>
              .
            </Text>

            <Text style={styles.footerBrand}>
              CTRLPASS · INDIA
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
  },

  /* ───────── Brand ───────── */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 54,
  },

  markWrap: {
    marginRight: 12,
  },

  markOuter: {
    width: 43,
    height: 43,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.28)',
    backgroundColor: 'rgba(214,180,122,0.055)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  markInner: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: '#D6B47A',
    alignItems: 'center',
    justifyContent: 'center',
  },


  markText: {
    color: '#090909',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -1,
  },


  brand: {
    color: '#F3F1EC',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.6,
  },


  brandSub: {
    color: '#66625C',
    fontSize: 11,
    fontWeight: '600',
        marginTop: 4,
  },

  /* ───────── Form ───────── */

  formArea: {
    flex: 1,
  },


  kicker: {
    color: '#9E7B48',
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 13,
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
    lineHeight: 20,
    marginTop: 14,
    maxWidth: 350,
  },

  phoneHighlight: {
    color: '#D6B47A',
    fontWeight: '600',
  },

  /* ───────── Phone ───────── */

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 29,
    marginBottom: 14,
  },

  countryCode: {
    height: 54,
    minWidth: 68,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#292824',
    backgroundColor: '#101010',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  countryText: {
    color: '#F2F0EA',
    fontSize: 14,
    fontWeight: '600',
  },


  phoneInput: {
    flex: 1,
    height: 54,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#292824',
    backgroundColor: '#101010',
    color: '#F5F5F2',
    paddingHorizontal: 17,
    fontSize: 15,
    letterSpacing: 0.5,
  },

  /* ───────── Buttons ───────── */

  primaryAction: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#E8E3D9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 8,
  },

  primaryActionText: {
    color: '#090909',
    fontSize: 14,
    fontWeight: '700',
  },

  actionArrow: {
    color: '#090909',
    fontSize: 18,
    marginLeft: 10,
    marginTop: -1,
  },

  secondaryAction: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2926',
    backgroundColor: 'rgba(255,255,255,0.025)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryActionText: {
    color: '#D8D5CE',
    fontSize: 13,
    fontWeight: '600',
  },

  disabled: {
    opacity: 0.48,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },

  /* ───────── Divider ───────── */

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#20201E',
  },


  dividerText: {
    color: '#57544F',
    fontSize: 11,
    fontWeight: '600',
        marginHorizontal: 13,
  },

  /* ───────── OTP ───────── */

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 31,
    marginBottom: 20,
  },

  otpBox: {
    width: 45,
    height: 55,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#292824',
    backgroundColor: '#101010',
    color: '#F5F5F2',
    textAlign: 'center',
    fontSize: 21,
    fontWeight: '700',
  },

  otpBoxFilled: {
    borderColor: '#B88A45',
    backgroundColor: 'rgba(184,138,69,0.08)',
  },

  resendButton: {
    alignItems: 'center',
    paddingVertical: 17,
  },

  resendText: {
    color: '#66625C',
    fontSize: 12,
  },

  resendAccent: {
    color: '#D6B47A',
    fontWeight: '600',
  },

  /* ───────── Back ───────── */

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 31,
    paddingVertical: 4,
  },

  backIcon: {
    color: '#D6B47A',
    fontSize: 27,
    lineHeight: 24,
    marginRight: 5,
  },

  backText: {
    color: '#817D76',
    fontSize: 12,
    fontWeight: '500',
  },

  /* ───────── Email ───────── */

  fieldGroup: {
    marginTop: 26,
    marginBottom: 8,
  },

  emailLinks: {
    alignItems: 'center',
    gap: 15,
    marginTop: 17,
  },

  linkText: {
    color: colors.textMuted,
    fontSize: 11,
  },

  linkAccent: {
    color: '#D6B47A',
    fontWeight: '600',
  },

  /* ───────── Footer ───────── */

  footer: {
    marginTop: 'auto',
    paddingTop: 46,
  },

  footerLine: {
    height: 1,
    backgroundColor: '#171716',
    marginBottom: 16,
  },

  legalFooter: {
    color: '#4F4C47',
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  legalAccent: {
    color: '#716B62',
  },


  footerBrand: {
    color: '#363430',
    fontSize: 11,
    fontWeight: '600',
        textAlign: 'center',
    marginTop: 12,
  },
});