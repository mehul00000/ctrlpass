export const colors = {
  // CtrlPass "Kiln: ember" — matches the web redesign (artifacts/logo/kit).
  // Warm near-black ground, cream ink, champagne gold as the only fire.
  // Values are the kiln tokens (oklch) converted to hex for RN.
  ink: '#0B0605', // Primary background — kiln paper
  textPrimary: '#F2EADD', // Primary typography — cream
  accent: '#D6B47A', // Primary CTA surface — brand champagne (unchanged)
  onAccent: '#100704', // Text/icons placed on accent
  go: '#D6B47A', // Active/positive accent (champagne)

  // Supporting neutrals
  white: '#FFFFFF',
  softBlack: '#000000',
  mutedText: '#B3A192', // secondary text — kiln muted
  border: 'rgba(242,234,221,0.12)', // kiln hairline rule
  disabled: '#8C7E70',

  // Semantic
  success: '#4ADE80',
  error: '#F87171',
  warning: '#E5B767',
  info: '#C9A86A', // link tone — muted champagne

  // Background aliases
  background: '#0B0605',
  surface: '#170E0B', // kiln paper-2 — wells and bands
  surfaceLight: '#221814', // kiln paper-3 — chips, overlays
  text: '#F2EADD',
  textSecondary: '#D5C8B9', // kiln ink-2

  // Kiln palette aliases
  champagne: '#D6B47A',
  gold: '#B88A45',
  cream: '#F2EADD',
  textMuted: '#B3A192',
  elevated: '#221814',
  glass: 'rgba(242,234,221,0.06)',
  glassStrong: 'rgba(242,234,221,0.10)',
  glassBorder: 'rgba(242,234,221,0.12)',
  goldSoft: 'rgba(214,180,122,0.16)', // champagne tint fill
  goldBorder: 'rgba(214,180,122,0.45)', // champagne border for selected states
  goldGlow: 'rgba(214,180,122,0.25)', // soft glow shadow under champagne
} as const;

export type ColorToken = keyof typeof colors;
