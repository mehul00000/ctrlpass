import React from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Text } from 'tamagui';
import Svg, { G, Path, Rect } from 'react-native-svg';

type Props = {
  size?: number;
  showWordmark?: boolean;
  tagline?: boolean;
  variant?: 'mark' | 'app';
  style?: StyleProp<ViewStyle>;
};

const COLORS = {
  surface: '#111111',
  border: 'rgba(214,180,122,0.22)',

  champagne: '#D6B47A',
  champagneBright: '#E4C98F',

  text: '#F5F5F2',
  muted: '#A7A39B',
};

// Aperture Pass mark: the C-gate admits the pass (256 grid, same geometry as web)
const RING_PATH =
  'M197.3 73.8 A88 88 0 1 0 197.3 182.2 L172.1 162.5 A56 56 0 1 1 172.1 93.5 Z';
const CHEVRON_PATH =
  'M122.9 78.9 L183.2 128 L122.9 177.1 L105.1 152.9 L132.8 128 L105.1 103.1 Z';

function CtrlPassMark({
  size,
  app = false,
}: {
  size: number;
  app?: boolean;
}) {
  // icon variant pads the mark like an app icon; mark fills the chip more
  const markScale = app ? 0.72 : 0.78;
  const center = 128 - 4 / markScale;

  return (
    <Svg
      accessible
      accessibilityLabel="CtrlPass logo"
      width={size}
      height={size}
      viewBox="0 0 256 256"
    >
      <Rect
        x={1.5}
        y={1.5}
        width={253}
        height={253}
        rx={70}
        fill={COLORS.surface}
        stroke={COLORS.border}
        strokeWidth={3}
      />
      <G
        transform={`translate(128 ${center}) scale(${markScale}) translate(-128 -128)`}
      >
        <Path d={RING_PATH} fill={COLORS.champagne} fillRule="evenodd" />
        <Path d={CHEVRON_PATH} fill={COLORS.champagneBright} />
      </G>
    </Svg>
  );
}

export function BrandLogo({
  size = 56,
  showWordmark = true,
  tagline = false,
  variant = 'mark',
  style,
}: Props) {
  return (
    <View
      style={[
        styles.container,
        style,
      ]}
    >
      <CtrlPassMark
        size={size}
        app={variant === 'app'}
      />

      {showWordmark ? (
        <View style={styles.wordmarkContainer}>
          <Text
            numberOfLines={1}
            style={[
              styles.wordmark,
              {
                fontSize: Math.max(
                  20,
                  size * 0.47,
                ),
              },
            ]}
          >
            Ctrl
            <Text style={styles.wordmarkAccent}>
              Pass
            </Text>
          </Text>

          {tagline ? (
            <Text
              numberOfLines={1}
              style={[
                styles.tagline,
                {
                  fontSize: Math.max(
                    8,
                    size * 0.13,
                  ),
                },
              ]}
            >
              DISCOVER · BOOK · EXPERIENCE
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  wordmarkContainer: {
    marginLeft: 12,

    minWidth: 0,
  },

  wordmark: {
    color: COLORS.text,

    fontWeight: '800',

    letterSpacing: -1.1,
  },

  wordmarkAccent: {
    color: COLORS.champagne,
  },

  tagline: {
    marginTop: 3,

    color: COLORS.muted,

    fontWeight: '600',

    letterSpacing: 1.1,
  },
});
