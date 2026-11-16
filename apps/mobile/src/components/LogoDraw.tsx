import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Svg, { Path, SvgProps } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * React Native port of the LogoDraw SwiftUI library
 * (github.com/RhuanCruz/swiftui-logo-draw): the mark's outline is drawn like
 * a pen (stroke dash), then the fill fades in, then onComplete fires.
 * With Reduce Motion on, the mark appears complete and onComplete fires at once.
 */

type SubPath = {
  d: string;
  /** Path length in user units — the dash array the pen animation runs against. */
  length: number;
  fillColor: string;
};

type Props = {
  /** Subpaths in pen order; each draws in sequence over the timeline. */
  paths: SubPath[];
  drawDuration?: number;
  fillStartPercent?: number;
  fillDuration?: number;
  size?: number;
  strokeWidth?: number;
  outlineColor: string;
  viewBox?: number;
  accessibilityName?: string;
  onComplete?: () => void;
  /** Change the value to replay. */
  replayTrigger?: number;
  style?: StyleProp<ViewStyle>;
} & Omit<SvgProps, 'viewBox'>;

export default function LogoDraw({
  paths,
  drawDuration = 1.2,
  fillStartPercent = 70,
  fillDuration = 0.35,
  size = 160,
  strokeWidth = 2,
  outlineColor,
  viewBox = 256,
  accessibilityName = 'Logo',
  onComplete,
  replayTrigger = 0,
  style,
  ...svgProps
}: Props) {
  const duration = Math.min(Math.max(drawDuration, 0.3), 4);
  const fillStart = Math.min(Math.max(fillStartPercent, 0), 100) / 100;
  const fillDur = Math.min(Math.max(fillDuration, 0.1), 1);

  const progress = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const done = useRef(onComplete);
  done.current = onComplete;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Each subpath draws over its slice of the timeline, slightly overlapping,
  // so the pen reads as one continuous stroke.
  const total = useMemo(
    () => paths.reduce((sum, p) => sum + p.length, 0),
    [paths],
  );

  const slices = useMemo(() => {
    let cursor = 0;
    const overlap = 0.12;
    return paths.map((p) => {
      const share = p.length / total;
      const start = cursor;
      cursor += share;
      const end = Math.min(1, start + share + (paths.length > 1 ? overlap : 0));
      return { ...p, start, end };
    });
  }, [paths, total]);

  useEffect(() => {
    progress.setValue(0);

    if (reduceMotion) {
      progress.setValue(1);
      done.current?.();
      return;
    }

    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: duration * 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) done.current?.();
    });
    return () => anim.stop();
  }, [progress, reduceMotion, duration, replayTrigger]);

  const fillOpacity = progress.interpolate({
    inputRange: [
      fillStart,
      Math.min(1, fillStart + fillDur / duration),
    ],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Svg
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityName}
      width={size}
      height={size}
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      style={style}
      {...svgProps}
    >
      {slices.map(({ d, length, fillColor, start, end }) => {
        const dash = progress.interpolate({
          inputRange: [start, end],
          outputRange: [length, 0],
          extrapolate: 'clamp',
        });
        return (
          <React.Fragment key={d}>
            <AnimatedPath
              d={d}
              fill={fillColor}
              opacity={fillOpacity}
            />
            <AnimatedPath
              d={d}
              fill="none"
              stroke={outlineColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={length}
              strokeDashoffset={dash}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}
