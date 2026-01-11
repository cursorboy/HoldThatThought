export const lightColors = {
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F8FAFA',

  // Primary accent - Mint
  mint: '#00D9A4',
  mintLight: '#E6FBF5',
  mintDark: '#00B88A',

  // Verdict colors
  true: '#00D9A4',
  trueLight: '#E6FBF5',
  false: '#FF5A5A',
  falseLight: '#FFEEEE',
  partial: '#FFB020',
  partialLight: '#FFF8E6',
  unverified: '#9CA3AF',
  unverifiedLight: '#F3F4F6',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Borders & misc
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  shadow: 'rgba(0, 0, 0, 0.08)',

  // Legacy
  white: '#FFFFFF',
  ghost: '#6B7280',
  muted: '#9CA3AF',
} as const;

export const darkColors = {
  // Backgrounds
  background: '#0A0C10',
  surface: '#12151C',

  // Primary accent - Mint (same)
  mint: '#00D9A4',
  mintLight: 'rgba(0, 217, 164, 0.15)',
  mintDark: '#00B88A',

  // Verdict colors
  true: '#00D9A4',
  trueLight: 'rgba(0, 217, 164, 0.15)',
  false: '#FF5A5A',
  falseLight: 'rgba(255, 90, 90, 0.15)',
  partial: '#FFB020',
  partialLight: 'rgba(255, 176, 32, 0.15)',
  unverified: '#6B7280',
  unverifiedLight: 'rgba(107, 114, 128, 0.15)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C0CC',
  textMuted: '#6B7280',

  // Borders & misc
  border: '#2A3140',
  borderLight: '#1A1F2A',
  shadow: 'rgba(0, 0, 0, 0.4)',

  // Legacy
  white: '#FFFFFF',
  ghost: '#B8C0CC',
  muted: '#6B7280',
} as const;

export type ThemeColors = typeof lightColors;

export const getColors = (isDark: boolean): ThemeColors =>
  isDark ? darkColors : lightColors;

export const getVerdictColors = (isDark: boolean) => {
  const colors = getColors(isDark);
  return {
    true: colors.true,
    false: colors.false,
    partial: colors.partial,
    unverified: colors.unverified,
  } as const;
};

export const getVerdictBackgrounds = (isDark: boolean) => {
  const colors = getColors(isDark);
  return {
    true: colors.trueLight,
    false: colors.falseLight,
    partial: colors.partialLight,
    unverified: colors.unverifiedLight,
  } as const;
};

// Default export for backward compatibility
export const colors = lightColors;
export const verdictColors = {
  true: lightColors.true,
  false: lightColors.false,
  partial: lightColors.partial,
  unverified: lightColors.unverified,
} as const;
export const verdictBackgrounds = {
  true: lightColors.trueLight,
  false: lightColors.falseLight,
  partial: lightColors.partialLight,
  unverified: lightColors.unverifiedLight,
} as const;
