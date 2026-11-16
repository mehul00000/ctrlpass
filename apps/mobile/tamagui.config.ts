import { createTamagui } from 'tamagui';
import { defaultConfig } from '@tamagui/config/v6';

// Uber Dark tokens on top of the base config — mirrors src/theme/colors.ts.
export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes: {
    dark: {
      ...defaultConfig.themes.dark,
      background: '#000000',
      backgroundHover: '#111111',
      backgroundPress: '#1F1F1F',
      color: '#FFFFFF',
      colorHover: '#FFFFFF',
      colorPress: '#F3F3F3',
      borderColor: '#374151',
      accent: '#F3F3F3',
      accentForeground: '#000000',
      accentBackground: '#F3F3F3',
      accentColor: '#000000',
    },
  },
});

export default tamaguiConfig;
