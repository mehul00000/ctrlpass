import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { TamaguiProvider } from 'tamagui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toaster } from './src/components/toast';
import tamaguiConfig from './tamagui.config';
import { AuthProvider } from './src/hooks/useAuth';
import RootNavigator from './src/navigation/RootNavigator';

/**
 * Clerk owns authentication/identity (publishable key only — the secret key
 * must never exist in the mobile app). Supabase remains the database layer.
 */
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function MissingClerkKeyNotice() {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>Configuration required</Text>
      <Text style={styles.noticeText}>
        EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Add it to apps/mobile/.env
        and restart the development server.
      </Text>
    </View>
  );
}

export default function App() {
  if (!publishableKey) {
    return <MissingClerkKeyNotice />;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
          <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
            <AuthProvider>
              <RootNavigator />
              <Toaster />
            </AuthProvider>
          </TamaguiProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  notice: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noticeTitle: {
    color: '#F5F5F2',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  noticeText: {
    color: '#77736C',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
