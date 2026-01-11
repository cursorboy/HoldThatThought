import { Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Verdict } from '../types';
import { useColors, typography } from '../theme';

interface VerdictBadgeProps {
  verdict: Verdict;
  animated?: boolean;
}

const verdictLabels: Record<Verdict, string> = {
  true: 'TRUE',
  false: 'FALSE',
  partial: 'MIXED',
  unverified: 'UNVERIFIED',
};

const verdictIcons: Record<Verdict, keyof typeof Ionicons.glyphMap> = {
  true: 'checkmark-circle',
  false: 'close-circle',
  partial: 'help-circle',
  unverified: 'help-circle-outline',
};

export function VerdictBadge({ verdict, animated = true }: VerdictBadgeProps) {
  const { verdictColors, verdictBackgrounds } = useColors();
  const scale = useSharedValue(animated ? 0.8 : 1);

  useEffect(() => {
    if (animated) {
      scale.value = withSequence(
        withSpring(1.05, { damping: 12 }),
        withSpring(1, { damping: 15 })
      );
    }
  }, [animated, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bgColor = verdictBackgrounds[verdict];
  const textColor = verdictColors[verdict];

  return (
    <Animated.View
      entering={animated ? FadeIn.duration(200) : undefined}
      style={[
        styles.badge,
        { backgroundColor: bgColor },
        animatedStyle,
      ]}
    >
      <Ionicons name={verdictIcons[verdict]} size={14} color={textColor} />
      <Text style={[typography.badge, { color: textColor }]}>
        {verdictLabels[verdict]}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
});
