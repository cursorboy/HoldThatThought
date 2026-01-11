import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { MicButton } from '../components/MicButton';
import { ClaimsList } from '../components/ClaimsList';
import { useFactCheckerContext } from '../context/FactCheckerContext';
import { useTheme, useColors, lightColors, darkColors } from '../theme';

const AnimatedView = Animated.View;
const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

export default function Index() {
  const { status, claims, toggleListening, clearClaims } = useFactCheckerContext();
  const { isDark, toggleTheme } = useTheme();
  const { colors } = useColors();

  const isListening = status === 'listening';

  // Animated theme transition
  const themeProgress = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    themeProgress.value = withTiming(isDark ? 1 : 0, { duration: 300 });
  }, [isDark]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.surface, darkColors.surface]
    ),
  }));

  const headerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.surface, darkColors.surface]
    ),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.textPrimary, darkColors.textPrimary]
    ),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(themeProgress.value, [0, 1], [0, 16]) }],
    backgroundColor: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.mint, darkColors.textPrimary]
    ),
  }));

  return (
    <AnimatedView style={[styles.container, containerStyle]}>
      <AnimatedSafeAreaView style={styles.safeArea}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        <AnimatedView style={[styles.header, headerStyle]}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Animated.Text style={[styles.title, titleStyle]}>Hold That Thought</Animated.Text>
          </View>
          <View style={styles.headerRight}>
            {claims.length > 0 && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Pressable onPress={clearClaims} style={styles.clearBtn}>
                  <Text style={[styles.clearText, { color: colors.mint }]}>Clear</Text>
                </Pressable>
              </Animated.View>
            )}
            <Pressable onPress={toggleTheme} style={[styles.themeToggle, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderWidth: 1 }]}>
              <Animated.View style={[styles.themeToggleKnob, knobStyle]}>
                <Ionicons
                  name={isDark ? 'moon' : 'sunny'}
                  size={14}
                  color={isDark ? colors.surface : '#fff'}
                />
              </Animated.View>
            </Pressable>
          </View>
        </AnimatedView>

        <View style={styles.feedSection}>
          <ClaimsList claims={claims} />
        </View>
      </AnimatedSafeAreaView>

      <View style={styles.micFloating}>
        <MicButton status={status} onPress={toggleListening} />
      </View>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 56,
    height: 56,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  themeToggle: {
    width: 44,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  themeToggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedSection: {
    flex: 1,
  },
  micFloating: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
  },
});
