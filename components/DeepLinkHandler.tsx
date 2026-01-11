import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useFactCheckerContext } from '../context/FactCheckerContext';

export function DeepLinkHandler() {
  const { toggleListening, isListening } = useFactCheckerContext();
  const hasHandledInitialUrl = useRef(false);

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      console.log('[DeepLink] Received URL:', url);

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
