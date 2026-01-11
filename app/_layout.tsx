import '../global.css';
import { useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../theme';
import { FactCheckerProvider } from '../context/FactCheckerContext';
import { DeepLinkHandler } from '../components/DeepLinkHandler';
import { AnimatedSplash } from '../components/AnimatedSplash';

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <FactCheckerProvider>
          <SafeAreaProvider>
            <DeepLinkHandler />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
              }}
            />
            {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
          </SafeAreaProvider>
        </FactCheckerProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
