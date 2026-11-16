import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  View,
} from 'react-native';
import {
  NavigationContainer,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from './types';

import AuthScreen from '../screens/auth/AuthScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import ConsentScreen from '../screens/auth/ConsentScreen';
import AccountStatusScreen from '../screens/auth/AccountStatusScreen';

import AttendeeNavigator from '../screens/attendee/AttendeeNavigator';
import VolunteerScreen from '../screens/volunteer/VolunteerScreen';
import LogoSplash from '../components/LogoSplash';

const Stack = createNativeStackNavigator<RootStackParamList>();

const COLORS = {
  background: '#050505',
  champagne: '#D6B47A',
  text: '#F5F5F2',
  muted: '#77736C',
};

export default function RootNavigator() {
  const {
    session,
    loading,
    profile,
    roles,
    accountStatus,
    consentAccepted,
    configured,
  } = useAuth();

  /*
   * Startup splash: the mark draws itself once per launch, then the
   * overlay fades out and hands over to whatever the auth phase shows.
   */
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  const finishSplash = () => {
    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 380,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setSplashVisible(false);
    });
  };

  useEffect(() => () => splashOpacity.stopAnimation(), [splashOpacity]);

  /*
   * Keep the app completely dark while authentication
   * and profile state are being resolved.
   *
   * This prevents a white/native-looking flash on both
   * Android and iOS during startup.
   */
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingMark}>
          <View style={styles.loadingDot} />
        </View>

        <ActivityIndicator
          size="small"
          color={COLORS.champagne}
          style={styles.spinner}
        />
      </View>
    );
  }

  const isSuspended =
    accountStatus === 'SUSPENDED' ||
    accountStatus === 'DISABLED';

  /*
   * PHASE 3 PENDING — identity mapping: profile/consent gating only applies
   * once the Clerk session maps to an application profile (a Supabase auth
   * UUID). Until then profile is null for every signed-in user, so forcing
   * ProfileSetup would dead-end against UUID-keyed writes. Gating returns
   * automatically when the mapping ships and profile loads.
   */
  const needsProfileSetup =
    configured &&
    !!session &&
    !!profile &&
    !profile.full_name;

  const needsConsent =
    configured &&
    !!session &&
    !!profile &&
    !needsProfileSetup &&
    !consentAccepted;

  /*
   * Volunteer mode is only available to users who
   * actually have the VOLUNTEER role.
   */
  const isVolunteer = roles.includes('VOLUNTEER');

  return (
    <>
      <NavigationContainer>
      <Stack.Navigator
        id="Root"
        screenOptions={{
          headerShown: false,

          contentStyle: {
            backgroundColor: COLORS.background,
          },

          animation: 'fade',

          gestureEnabled: true,

          freezeOnBlur: true,

          presentation: 'card',
        }}
      >
        {isSuspended ? (
          <Stack.Screen
            name="AccountStatus"
            component={AccountStatusScreen}
            initialParams={{
              reason:
                'Your CtrlPass account has been suspended by administration.',
            }}
            options={{
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
        ) : needsProfileSetup ? (
          <Stack.Screen
            name="ProfileSetup"
            component={ProfileSetupScreen}
            options={{
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
        ) : needsConsent ? (
          <Stack.Screen
            name="Consent"
            component={ConsentScreen}
            options={{
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
        ) : session ? (
          <>
            <Stack.Screen
              name="Attendee"
              component={AttendeeNavigator}
              options={{
                animation: 'fade',
                gestureEnabled: false,
              }}
            />

            {isVolunteer ? (
              <Stack.Screen
                name="Volunteer"
                component={VolunteerScreen}
                options={{
                  animation: 'slide_from_right',
                }}
              />
            ) : null}
          </>
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
        )}
      </Stack.Navigator>
      </NavigationContainer>

      {splashVisible ? (
        <Animated.View
          style={[styles.splashOverlay, { opacity: splashOpacity }]}
        >
          <LogoSplash onComplete={finishSplash} />
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },

  /*
   * Small branded loading mark.
   * Deliberately restrained — the startup screen should
   * feel like a product booting, not a splash advertisement.
   */
  loadingMark: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.28)',
    backgroundColor: '#111111',
  },

  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.champagne,
  },

  spinner: {
    marginTop: 18,
  },
});