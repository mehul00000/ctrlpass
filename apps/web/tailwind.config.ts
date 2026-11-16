import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

// CtrlPass design system — "Uber monochrome".
// Pure black canvas, white type, white CTAs, green reserved for
// confirmations/active states. Legacy token names (ink/sand/orange/cocoa/
// ember) are kept as semantic aliases so existing screens pick up the new
// identity; new code should use fg/base/accent.
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // shadcn-style semantic tokens for pasted ui components; mapped onto the house palette.
        background: '#000000',
        foreground: '#FFFFFF',
        card: '#141414',
        'card-foreground': '#FFFFFF',
        primary: '#FFFFFF',
        'primary-foreground': '#000000',
        muted: '#1A1A1A',
        'muted-foreground': '#A3A3A3',
        secondary: '#1A1A1A',
        'secondary-foreground': '#FFFFFF',
        'accent-foreground': '#000000',
        input: '#2A2A2A',
        border: '#2A2A2A',
        ring: '#FFFFFF',
        destructive: '#F97066',
        'destructive-foreground': '#FFFFFF',
        fg: {
          DEFAULT: '#FFFFFF',
          muted: '#A3A3A3',
          faint: '#6B6B6B',
        },
        accent: {
          DEFAULT: '#FFFFFF',
          light: '#E5E5E5',
          dark: '#BFBFBF',
          cyan: '#06C167',
        },
        ink: {
          DEFAULT: '#000000',
          surface: '#141414',
          subtle: '#1F1F1F',
        },
        sand: {
          DEFAULT: '#FFFFFF',
          light: '#FFFFFF',
          dark: '#D4D4D4',
        },
        orange: {
          DEFAULT: '#FFFFFF',
          light: '#E5E5E5',
          dark: '#BFBFBF',
        },
        cocoa: {
          DEFAULT: '#141414',
          light: '#1F1F1F',
          dark: '#0A0A0A',
        },
        // Homepage atmosphere tokens, remapped to the monochrome system.
        // "gold" is kept as a key only for existing class names — it is green now.
        ember: {
          DEFAULT: '#000000',
          surface: '#141414',
          elevated: '#1F1F1F',
          ivory: '#F5F5F5',
          muted: '#A3A3A3',
          faint: '#6B6B6B',
          gold: {
            DEFAULT: '#06C167',
            light: '#35D98A',
            deep: '#049A50',
          },
        },
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Boska', 'Iowan Old Style', 'Georgia', 'serif'],
      },
      boxShadow: {
        warm: '0 10px 30px -10px rgba(0, 0, 0, 0.8)',
        amber: '0 10px 30px -8px rgba(6, 193, 103, 0.30)',
        glow: '0 0 60px -12px rgba(255, 255, 255, 0.22)',
      },
    },
  },
  plugins: [animate],
};

export default config;
