import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { encode } from 'uqr';

interface QrCodeProps {
  value: string;
  size?: number;
  radius?: number;
}

export function QrCode({
  value,
  size = 220,
  radius = 18,
}: QrCodeProps) {
  const qr = useMemo(() => {
    return encode(value);
  }, [value]);

  /*
   * Keep a real quiet zone around the QR.
   *
   * The QR itself remains untouched. This is important for
   * reliable scanning at event gates.
   */
  const quietModules = 4;

  const availableSize =
    Math.max(size - quietModules * 2, 1);

  const moduleSize = Math.max(
    Math.floor(availableSize / qr.size),
    1,
  );

  const qrPixelSize =
    qr.size * moduleSize;

  const actualSize =
    qrPixelSize + quietModules * 2;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Ticket QR code"
      style={[
        styles.outer,
        {
          width: actualSize,
          height: actualSize,
          padding: quietModules,
          borderRadius: radius,
        },
      ]}
    >
      <View
        style={{
          width: qrPixelSize,
          height: qrPixelSize,
          backgroundColor: '#FFFFFF',
        }}
      >
        {qr.data.map((row, y) => (
          <View
            key={`row-${y}`}
            style={[
              styles.row,
              {
                height: moduleSize,
              },
            ]}
          >
            {row.map((dark, x) => (
              <View
                key={`module-${y}-${x}`}
                style={{
                  width: moduleSize,
                  height: moduleSize,
                  backgroundColor: dark
                    ? '#050505'
                    : '#FFFFFF',
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#FFFFFF',

    /*
     * Very subtle depth only.
     * Do not add heavy glass/shadow around a QR.
     */
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,

    elevation: 2,

    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
  },
});