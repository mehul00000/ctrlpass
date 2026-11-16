import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, typography } from '../theme';
import LogoDraw from './LogoDraw';

/**
 * Startup splash in the kiln identity: the CtrlPass mark draws itself,
 * the fill lands, the wordmark fades in, then onComplete hands over.
 */

// The CtrlPass mark, 256 grid (same geometry as BrandLogo / the web kit).
// Path lengths measured segment-by-segment for the pen animation.
const RING_D =
  'M197.3 73.8 A88 88 0 1 0 197.3 182.2 L172.1 162.5 A56 56 0 1 1 172.1 93.5 Z';
const RING_LENGTH = 808;
const CHEVRON_D =
  'M122.9 78.9 L183.2 128 L122.9 177.1 L105.1 152.9 L132.8 128 L105.1 103.1 Z';
const CHEVRON_LENGTH = 291;

const PATHS = [
  { d: RING_D, length: RING_LENGTH, fillColor: colors.champagne },
  { d: CHEVRON_D, length: CHEVRON_LENGTH, fillColor: '#E4C98F' },
];

export default function LogoSplash({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [drawn, setDrawn] = useState(false);
  const wordmark = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!drawn) return;
    Animated.timing(wordmark, {
      toValue: 1,
      duration: 350,
      delay: 120,
      useNativeDriver: true,
    }).start();
  }, [drawn, wordmark]);

  return (
    <View
      style={styles.screen}
      accessibilityLabel="CtrlPass"
    >
      <LogoDraw
        paths={PATHS}
        size={176}
        strokeWidth={2.5}
        outlineColor="#F2EADD"
        drawDuration={1.3}
        fillStartPercent={70}
        accessibilityName="CtrlPass"
        onComplete={() => setDrawn(true)}
      />

      <Animated.Text
        style={[
          styles.wordmark,
          { opacity: wordmark },
        ]}
      >
        CTRL
        <Text style={styles.wordmarkAccent}>
          PASS
        </Text>
      </Animated.Text>

      <View style={styles.footerSpace} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },

  wordmark: {
    marginTop: 24,
    fontFamily: typography.fontFamily.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },

  wordmarkAccent: {
    color: colors.accent,
  },

  footerSpace: {
    height: 24,
  },
});
