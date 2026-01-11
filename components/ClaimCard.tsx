import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeInDown,
  Layout,
  interpolateColor,
} from 'react-native-reanimated';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { FactCheck } from '../types';
import { VerdictBadge } from './VerdictBadge';
import { useColors, useTheme, lightColors, darkColors, typography } from '../theme';

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
  const { colors, verdictColors } = useColors();
  const { isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const themeProgress = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    themeProgress.value = withTiming(isDark ? 1 : 0, { duration: 300 });
  }, [isDark]);

  const toggleExpand = () => {
    setExpanded(!expanded);
    rotation.value = withSpring(expanded ? 0 : 180, { damping: 15 });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

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

  const borderStyle = useAnimatedStyle(() => ({
    borderTopColor: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.border, darkColors.border]
    ),
  }));

  const verdictColor = verdictColors[factCheck.verdict];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify().damping(18)}
      layout={Layout.springify().damping(18)}
      style={styles.wrapper}
    >
      <Pressable onPress={toggleExpand}>
        <Animated.View style={[styles.card, { borderLeftColor: verdictColor }, cardStyle]}>
          <View style={styles.header}>
            <View style={styles.claimWrapper}>
              <Animated.Text
                style={[typography.claim, textStyle]}
                numberOfLines={expanded ? undefined : 2}
              >
                "{factCheck.claim}"
              </Animated.Text>
            </View>
            <Animated.View style={chevronStyle}>
              <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
            </Animated.View>
          </View>

          <View style={styles.metaRow}>
            <VerdictBadge verdict={factCheck.verdict} />
            <Animated.Text style={[typography.timestamp, mutedStyle]}>
              {formatTimeAgo(factCheck.timestamp)}
            </Animated.Text>
          </View>

          {expanded && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={[styles.expandedContent, borderStyle]}
            >
              <Animated.Text style={[typography.caption, styles.sectionLabel, mutedStyle]}>
                CONTEXT
              </Animated.Text>
              <Animated.Text style={[typography.body, { lineHeight: 22 }, secondaryStyle]}>
                {factCheck.explanation}
              </Animated.Text>

              {factCheck.sources.length > 0 && (
                <>
                  <Animated.Text style={[typography.caption, styles.sectionLabel, { marginTop: 16 }, mutedStyle]}>
                    SOURCES
                  </Animated.Text>
                  {factCheck.sources.map((source, i) => (
                    <Pressable
                      key={i}
                      onPress={() => Linking.openURL(source.url)}
                      style={styles.sourceLink}
                    >
                      <Ionicons name="link-outline" size={14} color={colors.mint} />
                      <Text
                        style={[typography.caption, { color: colors.mint, flex: 1 }]}
                        numberOfLines={1}
                      >
                        {source.title}
                      </Text>
                    </Pressable>
                  ))}
                </>
              )}
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  claimWrapper: {
    flex: 1,
    marginRight: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  sectionLabel: {
    marginBottom: 8,
    letterSpacing: 1,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
});
