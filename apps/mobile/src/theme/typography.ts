export const typography = {
  fontFamily: {
    ui: 'System',
    display: 'serif', // kiln: Boska's slot — iOS New York / Android serif
    mono: 'monospace', // JetBrains Mono fallback
  },
  fontSize: {
    caption: 12,
    bodySm: 14,
    body: 16,
    cardHeading: 20,
    sectionHeading: 28,
    largeHeading: 36,
    display: 48,
    headlineSm: 21,
    labelMd: 14,
    labelLg: 16,
    labelSm: 12,
  },
  lineHeight: {
    caption: 16,
    bodySm: 20,
    body: 24,
    cardHeading: 28,
    sectionHeading: 36,
    largeHeading: 44,
    display: 56,
    headlineSm: 26,
    labelMd: 20,
    labelLg: 24,
    labelSm: 16,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export type TypographyToken = typeof typography;
