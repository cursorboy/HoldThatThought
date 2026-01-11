import { useState, useCallback } from 'react';
import { StreamingStatus } from '../types';

interface UseFluxTranscriptionOptions {
  onEndOfTurn?: (transcript: string) => void;
  onStartOfTurn?: () => void;
  onTranscript?: (transcript: string) => void;
  sampleRate?: number;
}

// Web stub - audio streaming not supported on web
export function useFluxTranscription(_options: UseFluxTranscriptionOptions = {}) {
  const [status] = useState<StreamingStatus>('idle');
  const [error] = useState<string | null>('Audio streaming only available on iOS/Android');

  const startStreaming = useCallback(async () => {
    console.warn('Audio streaming not available on web');
  }, []);

  const stopStreaming = useCallback(async () => {}, []);

  const toggleStreaming = useCallback(() => {
    console.warn('Audio streaming not available on web');
  }, []);

  return {
    status,
    currentTranscript: '',
    turnIndex: 0,
    error,
    startStreaming,
    stopStreaming,
    toggleStreaming,
    isStreaming: false,
  };
}
