import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text as RNText,
  View,
  ViewStyle,
} from 'react-native';
import { ButtonRoot } from './button/button';
import { Loader } from './loader';

interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

type Variant = NonNullable<ButtonProps['variant']>;
type Size = NonNullable<ButtonProps['size']>;

/*
 * Kiln palette. Class strings stay literal for uniwind's static discovery;
 * variant colors ride as inline styles so they always win the cascade.
 * danger maps onto beUI's ghost shape with destructive inline overrides.
 */
const LABEL_COLOR: Record<Variant, string> = {
  primary: '#100704',
  secondary: '#F2EADD',
  ghost: '#D6B47A',
  danger: '#D96B6B',
};

const VARIANT_STYLE: Record<Variant, ViewStyle> = {
  primary: {},
  secondary: {},
  ghost: {},
  danger: {
    backgroundColor: 'rgba(217,107,107,0.10)',
    borderColor: 'rgba(217,107,107,0.24)',
  },
};

const SIZES: Record<
  Size,
  {
    height: number;
    horizontalPadding: number;
    fontSize: number;
    labelClass: string;
    radius: number;
  }
> = {
  sm: {
    height: 40,
    horizontalPadding: 15,
    fontSize: 12,
    labelClass: 'text-[12px]',
    radius: 12,
  },

  md: {
    height: 50,
    horizontalPadding: 20,
    fontSize: 14,
    labelClass: 'text-[14px]',
    radius: 15,
  },

  lg: {
    height: 54,
    horizontalPadding: 22,
    fontSize: 15,
    labelClass: 'text-[15px]',
    radius: 16,
  },
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  size = 'md',
  disabled = false,
  onPress,
  style,
}: ButtonProps) {
  const inactive = disabled || loading;

  const sizeStyle = SIZES[size];

  return (
    <ButtonRoot
      variant={variant === 'danger' ? 'ghost' : variant}
      size={size}
      className="w-full"
      style={[
        styles.base,

        {
          height: sizeStyle.height,
          paddingHorizontal: sizeStyle.horizontalPadding,
          borderRadius: sizeStyle.radius,
        },

        VARIANT_STYLE[variant],

        inactive && styles.disabled,

        style,
      ]}
      accessibilityState={{
        disabled: inactive,
        busy: loading,
      }}
      disabled={inactive}
      onPress={inactive ? undefined : onPress}
    >
      {loading ? (
        <View style={styles.loadingContent}>
          <Loader
            variant="spinner"
            size={14}
            color={LABEL_COLOR[variant]}
          />

          <RNText
            className={sizeStyle.labelClass}
            style={[
              styles.label,
              { color: LABEL_COLOR[variant], fontSize: sizeStyle.fontSize },
            ]}
          >
            Please wait
          </RNText>
        </View>
      ) : (
        <RNText
          className={sizeStyle.labelClass}
          style={[
            styles.label,
            { color: LABEL_COLOR[variant], fontSize: sizeStyle.fontSize },
          ]}
        >
          {title}
        </RNText>
      )}
    </ButtonRoot>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,

    flexDirection: 'row',

    overflow: 'hidden',
  },

  label: {
    fontWeight: '700',
    letterSpacing: -0.15,
    textAlign: 'center',
  },

  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  disabled: {
    opacity: 0.42,
  },
});
