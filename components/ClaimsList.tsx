import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { FactCheck } from '../types';
import { ClaimCard } from './ClaimCard';
import { useColors, useTheme, lightColors, darkColors, typography } from '../theme';

interface ClaimsListProps {
  claims: FactCheck[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function ClaimsList({ claims, onRefresh, refreshing = false }: ClaimsListProps) {
  const { colors } = useColors();
  const { isDark } = useTheme();
  const themeProgress = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    themeProgress.value = withTiming(isDark ? 1 : 0, { duration: 300 });
  }, [isDark]);

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.textSecondary, darkColors.textSecondary]
    ),
  }));

  const mutedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.textMuted, darkColors.textMuted]
    ),
  }));

  if (claims.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="chatbubbles-outline" size={48} color={colors.border} />
        <Animated.Text style={[typography.body, { textAlign: 'center' }, textStyle]}>
          Start listening to fact-check conversations
        </Animated.Text>
        <Animated.Text style={[typography.caption, { textAlign: 'center' }, mutedTextStyle]}>
          Claims will appear here automatically
        </Animated.Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.mint}
            colors={[colors.mint]}
          />
        ) : undefined
      }
    >
      {claims.map((claim, index) => (
        <ClaimCard key={claim.id} factCheck={claim} index={index} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});
