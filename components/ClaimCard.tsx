import { View, StyleSheet, Pressable, Linking, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  FadeInDown,
  FadeIn,
  Layout,
  interpolateColor,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { FactCheck, DeepDiveResponse, Source } from '../types';
import { useTheme, lightColors, darkColors, typography } from '../theme';
import { geminiService } from '../services/gemini';

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

  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deepDiveData, setDeepDiveData] = useState<DeepDiveResponse | null>(null);

  const chevronRotation = useSharedValue(0);
  const cardScale = useSharedValue(1);

  useEffect(() => {
    themeProgress.value = withTiming(isDark ? 1 : 0, { duration: 300 });
  }, [isDark]);

  useEffect(() => {
    chevronRotation.value = withSpring(expanded ? 180 : 0, { damping: 28 });
  }, [expanded]);

  const handlePress = async () => {
    setExpanded(!expanded);

    if (!expanded && !deepDiveData && !isLoading) {
      setIsLoading(true);
      try {
        const data = await geminiService.getDeepDiveInfo(
          factCheck.claim,
          factCheck.explanation
        );
        setDeepDiveData(data);
      } catch (err) {
        console.log('[ClaimCard] deep dive error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePressIn = () => {
    cardScale.value = withSpring(0.98, { damping: 28 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 28 });
  };

  const openSource = (url: string) => {
    Linking.openURL(url).catch((err) => console.log('[ClaimCard] open URL error:', err));
  };

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
    transform: [{ scale: cardScale.value }],
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

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const mintColor = '#00D9A4';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(300)}
      layout={Layout.duration(250)}
      style={styles.wrapper}
    >
      <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.header}>
            <Animated.Text style={[styles.topic, textStyle, { flex: 1 }]}>
              {factCheck.claim}
            </Animated.Text>
            <Animated.View style={chevronStyle}>
              <Ionicons
                name="chevron-down"
                size={20}
                color={isDark ? darkColors.textMuted : lightColors.textMuted}
              />
            </Animated.View>
          </View>
          <Animated.Text style={[styles.info, secondaryStyle]}>
            {factCheck.explanation}
          </Animated.Text>

          {expanded && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.expandedContent}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={mintColor} />
                  <Animated.Text style={[styles.loadingText, mutedStyle]}>
                    Loading more info...
                  </Animated.Text>
                </View>
              ) : deepDiveData ? (
                <>
                  {deepDiveData.details ? (
                    <Animated.Text style={[styles.details, secondaryStyle]}>
                      {deepDiveData.details}
                    </Animated.Text>
                  ) : null}

                  {deepDiveData.sources.length > 0 && (
                    <View style={styles.sourcesContainer}>
                      <Animated.Text style={[styles.sourcesLabel, mutedStyle]}>
                        Sources
                      </Animated.Text>
                      {deepDiveData.sources.map((source: Source, i: number) => (
                        <Animated.View
                          key={i}
                          entering={FadeIn.delay(i * 50).duration(150)}
                        >
                          <Pressable
                            onPress={() => openSource(source.url)}
                            style={styles.sourceLink}
                          >
                            <Ionicons name="link-outline" size={14} color={mintColor} />
                            <Animated.Text
                              style={[styles.sourceLinkText, { color: mintColor }]}
                              numberOfLines={1}
                            >
                              {source.title}
                            </Animated.Text>
                          </Pressable>
                        </Animated.View>
                      ))}
                    </View>
                  )}
                </>
              ) : null}
            </Animated.View>
          )}

          <View style={styles.footer}>
            <Animated.Text style={[typography.timestamp, mutedStyle]}>
              {formatTimeAgo(factCheck.timestamp)}
            </Animated.Text>
          </View>
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
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
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
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  details: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sourcesContainer: {
    gap: 8,
  },
  sourcesLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  sourceLinkText: {
    fontSize: 14,
    flex: 1,
  },
});
