import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  RouteProp,
  useRoute,
} from '@react-navigation/native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme';

export default function AccountStatusScreen() {
  const route =
    useRoute<
      RouteProp<RootStackParamList, 'AccountStatus'>
    >();

  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const reason =
    route.params?.reason ??
    'Your account access has been restricted by platform administration.';

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        {/* Status indicator */}

        <View style={styles.statusWrap}>
          <View style={styles.statusOuter}>
            <View style={styles.statusInner}>
              <Text style={styles.statusMark}>!</Text>
            </View>
          </View>
        </View>

        {/* Header */}

        <Text style={styles.eyebrow}>
          ACCOUNT SECURITY
        </Text>

        <Text style={styles.title}>
          Access{'\n'}restricted.
        </Text>

        <Text style={styles.body}>
          {reason}
        </Text>

        {/* Support */}

        <View style={styles.supportCard}>
          <View style={styles.supportIcon}>
            <Text style={styles.supportMark}>?</Text>
          </View>

          <View style={styles.supportCopy}>
            <Text style={styles.supportTitle}>
              Think this is a mistake?
            </Text>

            <Text style={styles.supportText}>
              Contact CtrlPass support and include the
              email address associated with your account.
            </Text>

            <Text style={styles.email}>
              support@ctrlpass.in
            </Text>
          </View>
        </View>

        {/* Actions */}

        <View
          style={[
            styles.actions,
            {
              paddingBottom:
                Math.max(insets.bottom, 8),
            },
          ]}
        >
          <Pressable
            onPress={signOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.signOutText}>
              Sign Out
            </Text>
          </Pressable>

          <Text style={styles.securityNote}>
            Signing out does not remove your account or
            change its current status.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 36,
  },

  /* Status */

  statusWrap: {
    alignItems: 'flex-start',
    marginBottom: 30,
  },

  statusOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(217,107,107,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(217,107,107,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusInner: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: 'rgba(217,107,107,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(217,107,107,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusMark: {
    color: colors.error,
    fontSize: 21,
    fontWeight: '700',
  },

  /* Header */


  eyebrow: {
    color: '#68645E',
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 12,
  },


  title: {
    color: '#F5F5F2',
    fontSize: 36,
    lineHeight: 39,
    fontWeight: '700',
    letterSpacing: -1.4,
  },

  body: {
    color: '#89857E',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 16,
    maxWidth: 355,
  },

  /* Support */

  supportCard: {
    marginTop: 29,
    backgroundColor: '#101010',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 16,
    flexDirection: 'row',
  },

  supportIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#181715',
    borderWidth: 1,
    borderColor: '#2A2927',
    alignItems: 'center',
    justifyContent: 'center',
  },

  supportMark: {
    color: colors.champagne,
    fontSize: 13,
    fontWeight: '700',
  },

  supportCopy: {
    flex: 1,
    marginLeft: 12,
  },

  supportTitle: {
    color: '#D8D5CE',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },

  supportText: {
    color: '#68645E',
    fontSize: 10,
    lineHeight: 16,
  },

  email: {
    color: colors.champagne,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 8,
  },

  /* Actions */

  actions: {
    marginTop: 'auto',
    paddingTop: 28,
  },

  signOutButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E8E5DE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  signOutText: {
    color: '#090909',
    fontSize: 13,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },

  securityNote: {
    color: '#55524D',
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 11,
    paddingHorizontal: 15,
  },
});