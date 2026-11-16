import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Loader } from './loader';
import { Text } from 'tamagui';

const COLORS = {
  background: '#050505',
  surface: '#111111',
  surfacePressed: '#191919',

  border: 'rgba(255,255,255,0.08)',

  text: '#F5F5F2',
  secondary: '#A7A39B',
  muted: '#77736C',

  champagne: '#D6B47A',
  champagnePressed: '#C4A269',
  darkText: '#17130D',

  error: '#D96B6B',
};

function ActionButton({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
}) {
  const isOutline = variant === 'outline';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionButton,
        isOutline
          ? styles.outlineButton
          : styles.primaryButton,
        pressed && styles.actionButtonPressed,
      ]}
    >
      {({ pressed }) => (
        <Text
          style={[
            styles.actionText,
            isOutline
              ? styles.outlineText
              : styles.primaryText,
            pressed && styles.actionTextPressed,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function LoadingState({
  message = 'Loading...',
}: {
  message?: string;
}) {
  return (
    <View style={styles.fullState}>
      <View style={styles.loadingOrb}>
        <Loader
          variant="dots"
          size={30}
          color={COLORS.champagne}
        />
      </View>

      <Text style={styles.loadingTitle}>
        {message}
      </Text>

      <Text style={styles.loadingSubtitle}>
        Just a moment
      </Text>
    </View>
  );
}

export function EmptyState({
  title = 'No items found',
  description,
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.fullState}>
      <View style={styles.emptyMark}>
        <View style={styles.emptyMarkInner} />
      </View>

      <Text style={styles.stateTitle}>
        {title}
      </Text>

      {description ? (
        <Text style={styles.stateDescription}>
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <ActionButton
          label={actionLabel}
          onPress={onAction}
        />
      ) : null}
    </View>
  );
}

export function ErrorState({
  message = 'An unexpected error occurred',
  onRetry,
  onBack,
}: {
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
}) {
  return (
    <View style={styles.fullState}>
      <View style={styles.errorMark}>
        <View style={styles.errorLine} />
        <View style={styles.errorDot} />
      </View>

      <Text style={styles.stateTitle}>
        Something went wrong
      </Text>

      <Text style={styles.stateDescription}>
        {message}
      </Text>

      <View style={styles.actions}>
        {onRetry ? (
          <ActionButton
            label="Try Again"
            onPress={onRetry}
          />
        ) : null}

        {onBack ? (
          <ActionButton
            label="Go Back"
            onPress={onBack}
            variant="outline"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullState: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 28,
    paddingVertical: 48,

    backgroundColor: COLORS.background,
  },

  loadingOrb: {
    width: 54,
    height: 54,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 20,

    borderRadius: 27,

    backgroundColor: COLORS.surface,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadingTitle: {
    color: COLORS.text,

    fontSize: 16,
    lineHeight: 22,

    fontWeight: '600',

    textAlign: 'center',
  },

  loadingSubtitle: {
    marginTop: 5,

    color: COLORS.muted,

    fontSize: 13,
    lineHeight: 18,

    textAlign: 'center',
  },

  emptyMark: {
    width: 64,
    height: 64,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 22,

    borderRadius: 22,

    backgroundColor: COLORS.surface,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyMarkInner: {
    width: 20,
    height: 20,

    borderRadius: 6,

    borderWidth: 1.5,
    borderColor: COLORS.champagne,

    opacity: 0.85,
  },

  errorMark: {
    width: 64,
    height: 64,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 22,

    borderRadius: 22,

    backgroundColor: 'rgba(217,107,107,0.08)',

    borderWidth: 1,
    borderColor: 'rgba(217,107,107,0.20)',
  },

  errorLine: {
    width: 2,
    height: 20,

    borderRadius: 2,

    backgroundColor: COLORS.error,

    transform: [
      {
        rotate: '45deg',
      },
    ],
  },

  errorDot: {
    position: 'absolute',

    width: 3,
    height: 3,

    bottom: 16,

    borderRadius: 2,

    backgroundColor: COLORS.error,
  },

  stateTitle: {
    maxWidth: 320,

    color: COLORS.text,

    fontSize: 21,
    lineHeight: 27,

    fontWeight: '700',

    letterSpacing: -0.35,

    textAlign: 'center',
  },

  stateDescription: {
    maxWidth: 320,

    marginTop: 8,

    color: COLORS.secondary,

    fontSize: 14,
    lineHeight: 21,

    textAlign: 'center',
  },

  actions: {
    width: '100%',

    alignItems: 'center',

    marginTop: 24,

    gap: 10,
  },

  actionButton: {
    minWidth: 150,
    minHeight: 48,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 22,

    borderRadius: 15,
  },

  primaryButton: {
    backgroundColor: COLORS.champagne,
  },

  outlineButton: {
    backgroundColor: 'transparent',

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  actionButtonPressed: {
    opacity: 0.82,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  actionText: {
    fontSize: 14,
    lineHeight: 19,

    fontWeight: '700',
  },

  primaryText: {
    color: COLORS.darkText,
  },

  outlineText: {
    color: COLORS.text,
  },

  actionTextPressed: {
    opacity: 0.9,
  },
});