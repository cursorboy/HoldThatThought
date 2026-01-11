import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Linking from 'expo-linking';
import { useFactCheckerContext } from '../context/FactCheckerContext';
import { liveActivity } from '../services/liveActivity';

export function DeepLinkHandler() {
  const { toggleListening, isListening } = useFactCheckerContext();
  const hasHandledInitialUrl = useRef(false);
  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  // Check for pending widget action when app becomes active
  useEffect(() => {
    const checkWidgetAction = async () => {
      console.log('[DeepLink] Checking pending widget action...');
      let action: string | null = null;
      try {
        action = await liveActivity.checkPendingWidgetAction();
        console.log('[DeepLink] Pending action:', action);
      } catch (err) {
        console.log('[DeepLink] ERROR checking widget action:', err);
      }
      if (action === 'start-listening' && !isListeningRef.current) {
        console.log('[DeepLink] Starting listening from widget...');
        toggleListening();
      }
    };

    // Check on mount
    setTimeout(checkWidgetAction, 200);

    // Check when app becomes active
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        checkWidgetAction();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [toggleListening]);

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      console.log('[DeepLink] Received URL:', url);

      // Handle empty path or "open" - this comes from the widget, start listening
      if (url === 'holdthatthought://' || url === 'holdthatthought:' || url.includes('://open')) {
        console.log('[DeepLink] Widget opened app - starting listening');
        if (!isListening) {
          toggleListening();
        }
        return;
      }

      if (url.includes('start-listening')) {
        console.log('[DeepLink] Start listening requested, isListening:', isListening);
        if (!isListening) {
          console.log('[DeepLink] Starting listening...');
          toggleListening();
        }
      } else if (url.includes('stop-listening')) {
        console.log('[DeepLink] Stop listening requested');
        if (isListening) {
          toggleListening();
        }
      } else if (url.includes('toggle-listening')) {
        console.log('[DeepLink] Toggling listening');
        toggleListening();
      }
    };

    // Handle URL when app opens from deep link (cold start)
    if (!hasHandledInitialUrl.current) {
      hasHandledInitialUrl.current = true;
      Linking.getInitialURL().then((url) => {
        console.log('[DeepLink] Initial URL:', url);
        if (url) {
          // Small delay to ensure context is ready
          setTimeout(() => handleUrl({ url }), 100);
        }
      });
    }

    // Handle URL when app is already open (warm start)
    const subscription = Linking.addEventListener('url', handleUrl);

    return () => {
      subscription.remove();
    };
  }, [toggleListening, isListening]);

  return null;
}
