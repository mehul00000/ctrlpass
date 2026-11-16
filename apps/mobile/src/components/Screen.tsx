import React from 'react';
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  ScrollView,
  Text,
} from 'tamagui';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';

interface Props {
  title?: string;
  children: React.ReactNode;
  scroll?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

const COLORS = {
  background: '#050505',
  surface: '#111111',
  border: 'rgba(255,255,255,0.08)',

  text: '#F5F5F2',
  muted: '#77736C',
  champagne: '#D6B47A',
};

export default function Screen({
  title,
  children,
  scroll = false,
  onBack,
  rightAction,
}: Props) {
  const content = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={
        Platform.OS === 'ios'
          ? 'interactive'
          : 'on-drag'
      }
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={
        Platform.OS === 'ios'
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        'top',
        'left',
        'right',
      ]}
    >
      <StatusBar barStyle="light-content" />

      {title ? (
        <View style={styles.header}>
          <View style={styles.headerSide}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
              >
                <View style={styles.backIcon}>
                  <View style={styles.backLine} />
                  <View style={styles.backArrowTop} />
                  <View style={styles.backArrowBottom} />
                </View>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.headerTitleContainer}>
            <Text
              numberOfLines={1}
              style={styles.headerTitle}
            >
              {title}
            </Text>
          </View>

          <View
            style={[
              styles.headerSide,
              styles.headerRight,
            ]}
          >
            {rightAction ?? null}
          </View>
        </View>
      ) : null}

      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    minHeight: 58,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 12,

    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,

    backgroundColor: COLORS.background,
  },

  headerSide: {
    width: 46,
    minHeight: 46,

    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  headerRight: {
    alignItems: 'flex-end',
  },

  headerTitleContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 8,
  },

  headerTitle: {
    color: COLORS.text,

    fontSize: 16,
    lineHeight: 21,

    fontWeight: '700',

    letterSpacing: -0.25,

    textAlign: 'center',
  },

  headerButton: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 14,

    backgroundColor: COLORS.surface,
  },

  headerButtonPressed: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  backIcon: {
    width: 20,
    height: 20,

    alignItems: 'center',
    justifyContent: 'center',
  },

  backLine: {
    position: 'absolute',

    width: 14,
    height: 1.7,

    borderRadius: 2,

    backgroundColor: COLORS.text,
  },

  backArrowTop: {
    position: 'absolute',

    width: 8,
    height: 8,

    left: 2,

    borderLeftWidth: 1.7,
    borderBottomWidth: 1.7,

    borderColor: COLORS.text,

    transform: [
      {
        rotate: '45deg',
      },
    ],
  },

  backArrowBottom: {
    display: 'none',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 120,
  },

  content: {
    flex: 1,

    paddingHorizontal: 18,
    paddingTop: 18,
  },
});

export { Screen };