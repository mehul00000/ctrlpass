/** CtrlPass design tokens — single source of truth for mobile & web */

export const colors = {
  // Primary palette
  cocoa: '#09090E',
  sand: '#F2F2F7',
  orange: '#C6F135',
  ink: '#101016',

  // Extended
  cocoaLight: '#24242F',
  cocoaDark: '#101016',
  sandLight: '#FFFFFF',
  sandDark: '#C9C9D6',
  orangeLight: '#DBFF6B',
  orangeDark: '#96BC1E',

  // Semantic
  success: '#2E7D32',
  error: '#C62828',
  warning: '#F57F17',
  info: '#1565C0',

  // Neutral
  white: '#FFFFFF',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    sans: '"Inter", system-ui, -apple-system, sans-serif',
    display: '"Space Grotesk", "Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
} as const;

export const EVENT_CATEGORIES = [
  'Technology',
  'Music',
  'Sports',
  'Arts',
  'Business',
  'Food',
  'Comedy',
  'Festival',
  'Workshop',
  'Conference',
  'Meetup',
  'Other',
] as const;
