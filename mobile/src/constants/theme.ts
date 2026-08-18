/**
 * Design tokens from DESIGN.md (RSU Tangsel Care).
 * Light values follow the spec exactly; dark values are app-side derivations
 * (the spec only defines light mode) with a cool teal undertone matching the brand.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1C2626',
    background: '#FFFFFF',
    backgroundElement: '#F1F4F4',
    backgroundSelected: '#E6EBEB',
    textSecondary: '#5C6B6B',
    border: '#E2E8E8',
    primary: '#0E7D80',
    primaryForeground: '#FFFFFF',
    primaryHover: '#0A5F61',
    accent: '#E63946',
    success: '#16A34A',
    warning: '#D97706',
    destructive: '#DC2626',
  },
  dark: {
    text: '#E8EEEE',
    background: '#0F1313',
    backgroundElement: '#1A2020',
    backgroundSelected: '#243030',
    textSecondary: '#9DA9A9',
    border: '#263030',
    primary: '#52B9BD',
    primaryForeground: '#FFFFFF',
    primaryHover: '#5FC7CA',
    accent: '#E63946',
    success: '#16A34A',
    warning: '#D97706',
    destructive: '#DC2626',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
