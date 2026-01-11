import { useEffect } from 'react';
import { router } from 'expo-router';

export default function NotFoundScreen() {
  useEffect(() => {
    // Redirect to home immediately
    router.replace('/');
  }, []);

  return null;
}
