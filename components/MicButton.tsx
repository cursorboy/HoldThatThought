import { Pressable, View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  cancelAnimation,
  interpolateColor,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useTheme, lightColors, darkColors, typography } from '../theme';
import { ScannerStatus } from '../types';

const BUTTON_SIZE = 72;

interface MicButtonProps {
  status: ScannerStatus;
  onPress: () => void;
}

export function MicButton({ status, onPress }: MicButtonProps) {
  const { colors } = useColors();
  const { isDark } = useTheme();
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const themeProgress = useSharedValue(isDark ? 1 : 0);

  const isListening = status === 'listening';
  const isProcessing = status === 'processing';

  useEffect(() => {
    themeProgress.value = withTiming(isDark ? 1 : 0, { duration: 300 });
  }, [isDark]);

  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(1.6, { duration: 1200, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 0 }),
          withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isListening, pulseScale, pulseOpacity]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: isListening
      ? colors.mint
      : interpolateColor(
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

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.textSecondary, darkColors.textSecondary]
    ),
  }));

  const handlePressIn = () => {
    console.log('[MicButton] pressIn');
    scale.value = withSpring(0.92, { damping: 15 });
  };

  const handlePressOut = () => {
    console.log('[MicButton] pressOut');
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    console.log('[MicButton] onPress, status:', status);
    onPress();
  };

  const statusText = isProcessing
    ? 'Processing...'
    : isListening
    ? 'Listening...'
    : 'Tap to listen';

  return (
    <View style={styles.container}>
      <View style={styles.buttonWrapper}>
        <Animated.View
          style={[
            styles.pulse,
            { backgroundColor: colors.mint },
            pulseStyle,
          ]}
        />

        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isProcessing}
        >
          <Animated.View
            style={[
              styles.button,
              { borderColor: colors.mint },
              isProcessing && {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: 0.7,
              },
              buttonStyle,
            ]}
          >
            <Ionicons
              name={isListening ? 'mic' : 'mic-outline'}
              size={28}
              color={isListening ? colors.white : colors.mint}
            />
          </Animated.View>
        </Pressable>
      </View>

      <Animated.Text style={[typography.caption, styles.statusText, textStyle]}>
        {statusText}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  statusText: {
    marginTop: 12,
  },
});
