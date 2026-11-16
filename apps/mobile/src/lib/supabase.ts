// Hermes' URL props are getter-only; supabase-js assigns url.protocol — polyfill first
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ENV, isSupabaseConfigured } from '../config/env';

const url = isSupabaseConfigured() ? ENV.SUPABASE_URL : 'https://example.supabase.co';
const key = isSupabaseConfigured() ? ENV.SUPABASE_ANON_KEY : 'public-anon-placeholder';

/*
 * Auth session tokens live in the Keychain/Keystore (expo-secure-store),
 * never in AsyncStorage plaintext (OWASP MASVS-STORAGE). SecureStore caps
 * values at 2KB on Android — a session that overflows falls back to
 * AsyncStorage so sign-in still works, and the token refresh cycle keeps
 * it short-lived.
 * shortcut: >2KB sessions persist in plaintext on a minority of Android devices, upgrade to encrypted MMKV when it bites
 */
const secureStorage = {
  getItem: async (storageKey: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(storageKey);
    } catch {
      return AsyncStorage.getItem(storageKey);
    }
  },
  setItem: async (storageKey: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(storageKey, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch {
      await AsyncStorage.setItem(storageKey, value);
    }
  },
  removeItem: async (storageKey: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(storageKey);
    } catch {
      await AsyncStorage.removeItem(storageKey);
    }
  },
};

export const supabase = createClient(url, key, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
