import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';
import { ThemeProvider } from '../theme';
import { FactCheckerProvider } from '../context/FactCheckerContext';
import { DeepLinkHandler } from '../components/DeepLinkHandler';

export default function RootLayout() {
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
          </SafeAreaProvider>
        </FactCheckerProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
