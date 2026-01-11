import { View, Text, Pressable, StyleSheet } from 'react-native';
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

  const micSectionStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.surface, darkColors.surface]
    ),
  }));

  return (
    <AnimatedView style={[styles.container, containerStyle]}>
      <AnimatedSafeAreaView style={styles.safeArea}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        <AnimatedView style={[styles.header, headerStyle]}>
          <Animated.Text style={[styles.title, titleStyle]}>HoldThatThought</Animated.Text>
          <View style={styles.headerRight}>
            {claims.length > 0 && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Pressable onPress={clearClaims} style={styles.clearBtn}>
                  <Text style={[styles.clearText, { color: colors.mint }]}>Clear</Text>
                </Pressable>
              </Animated.View>
            )}
            <Pressable onPress={toggleTheme} style={styles.themeBtn}>
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
            <View style={[styles.statusDot, { backgroundColor: colors.border }, isListening && { backgroundColor: colors.mint }]} />
          </View>
        </AnimatedView>

        <View style={styles.feedSection}>
          <ClaimsList claims={claims} />
        </View>

        <AnimatedView style={[styles.micSection, micSectionStyle]}>
          <MicButton status={status} onPress={toggleListening} />
        </AnimatedView>
      </AnimatedSafeAreaView>
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
  title: {
    fontSize: 24,
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
  themeBtn: {
    padding: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  feedSection: {
    flex: 1,
  },
  micSection: {},
});
