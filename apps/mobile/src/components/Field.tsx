import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'tamagui';
import { Input, InputProps } from './input';

interface FieldProps extends InputProps {
  label?: string;
}

const COLORS = {
  label: '#BDB9B1',
};

/*
 * Shared labeled input. The beUI input owns the well styling, focus ring,
 * error shake and the drawn success check; Field only adds the label row.
 */
export function Field({
  label,
  error,
  ...props
}: FieldProps) {
  return (
    <View
      style={styles.field}
    >
      {label ? (
        <Text
          color={COLORS.label}
          fontSize={13}
          fontWeight="600"
          letterSpacing={0.1}
          marginBottom={8}
        >
          {label}
        </Text>
      ) : null}

      <Input
        error={error}
        style={styles.input}

        autoCapitalize="none"

        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    width: '100%',
    marginBottom: 18,
  },

  input: {
    width: '100%',
    minHeight: 52,
  },
});
