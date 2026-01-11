import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  transition: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@holdthat_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);
  const transition = useSharedValue(1);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
      setIsLoaded(true);
    });
  }, []);

  const isDark = mode === 'system'
    ? systemColorScheme === 'dark'
    : mode === 'dark';

  const setMode = (newMode: ThemeMode) => {
    // Animate transition
    transition.value = withTiming(0, { duration: 150, easing: Easing.ease }, () => {
      transition.value = withTiming(1, { duration: 150, easing: Easing.ease });
    });

    setTimeout(() => {
      setModeState(newMode);
      AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    }, 150);
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode, toggleTheme, transition: transition.value }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Animated wrapper for smooth transitions
export function ThemeTransition({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(0.97, { duration: 100 }, () => {
      opacity.value = withTiming(1, { duration: 200 });
    });
  }, [isDark]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
