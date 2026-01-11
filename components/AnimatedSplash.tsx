import { useEffect, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { useTheme } from '../theme';

SplashScreen.preventAutoHideAsync();

interface Props {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: Props) {
  const { isDark } = useTheme();
  const [ready, setReady] = useState(false);

  // Logo animations
  const logoScale = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const logoOpacity = useSharedValue(0);

  // Title animation
  const titleOpacity = useSharedValue(0);

  // Subtitle animation
  const subtitleOpacity = useSharedValue(0);

  // Exit animation
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);

  useEffect(() => {
    const prepare = async () => {
      await SplashScreen.hideAsync();
      setReady(true);
    };
    prepare();
  }, []);

  useEffect(() => {
    if (!ready) return;

    // Stage 1: Logo spins in with bounce
    logoOpacity.value = withTiming(1, { duration: 300 });
    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
      mass: 1,
    });
    logoRotation.value = withTiming(360, { duration: 800, easing: Easing.out(Easing.cubic) });

    // Stage 2: Title fades in
    titleOpacity.value = withDelay(700, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));

    // Stage 3: Subtitle fades in
    subtitleOpacity.value = withDelay(950, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));

    // Stage 6: Exit with zoom out (give more time to stabilize)
    const timeout = setTimeout(() => {
      containerScale.value = withTiming(1.1, {
        duration: 300,
        easing: Easing.in(Easing.cubic)
      });
      containerOpacity.value = withTiming(0, {
        duration: 400,
        easing: Easing.in(Easing.cubic)
      }, () => {
        runOnJS(onFinish)();
      });
    }, 2800);

    return () => clearTimeout(timeout);
  }, [ready]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const bgColor = isDark ? '#0A0C10' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const mutedColor = isDark ? '#6B7280' : '#9CA3AF';
  const mint = '#00D9A4';

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }, containerStyle]}>
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[styles.title, { color: textColor }, titleStyle]}>
          Hold That Thought
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { color: mutedColor }, subtitleStyle]}>
          Real-time fact checking
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});
