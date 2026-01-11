import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeInDown,
  Layout,
  interpolateColor,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { FactCheck } from '../types';
import { useTheme, lightColors, darkColors, typography } from '../theme';

interface ClaimCardProps {
  factCheck: FactCheck;
  index: number;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function ClaimCard({ factCheck, index }: ClaimCardProps) {
  const { isDark } = useTheme();
  const themeProgress = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    themeProgress.value = withTiming(isDark ? 1 : 0, { duration: 300 });
  }, [isDark]);

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.background, darkColors.background]
    ),
    shadowColor: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.shadow, darkColors.shadow]
    ),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.textPrimary, darkColors.textPrimary]
    ),
  }));

  const mutedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.textMuted, darkColors.textMuted]
    ),
  }));

  const secondaryStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.textSecondary, darkColors.textSecondary]
    ),
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify().damping(18)}
      layout={Layout.springify().damping(18)}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.card, cardStyle]}>
        <Animated.Text style={[styles.topic, textStyle]}>
          {factCheck.claim}
        </Animated.Text>
        <Animated.Text style={[styles.info, secondaryStyle]}>
          {factCheck.explanation}
        </Animated.Text>
        <View style={styles.footer}>
          <Animated.Text style={[typography.timestamp, mutedStyle]}>
            {formatTimeAgo(factCheck.timestamp)}
          </Animated.Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  topic: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  info: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
});
