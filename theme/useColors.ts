import { useMemo } from 'react';
import { useTheme } from './ThemeContext';
import { getColors, getVerdictColors, getVerdictBackgrounds, ThemeColors } from './colors';

export function useColors() {
  const { isDark } = useTheme();

  return useMemo(() => ({
    colors: getColors(isDark),
    verdictColors: getVerdictColors(isDark),
    verdictBackgrounds: getVerdictBackgrounds(isDark),
    isDark,
  }), [isDark]);
}

export type { ThemeColors };
