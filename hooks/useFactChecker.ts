import { useState, useCallback, useRef, useEffect } from 'react';
import { FactCheck, ScannerStatus } from '../types';
import { liveActivity } from '../services/liveActivity';
import { geminiService } from '../services/gemini';
import { useFluxTranscription } from './useFluxTranscription';

export function useFactChecker() {
  const [claims, setClaims] = useState<FactCheck[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);
  const processTranscriptRef = useRef<(t: string) => Promise<void>>(undefined);

  console.log('[FactChecker] hook initialized');

  // Flux transcription with EndOfTurn callback
  const {
    status: streamingStatus,
    currentTranscript,
    error: streamingError,
    startStreaming,
    stopStreaming,
    isStreaming,
  } = useFluxTranscription({
    onEndOfTurn: (transcript) => {
      console.log('[FactChecker] onEndOfTurn received:', transcript);
      processTranscriptRef.current?.(transcript);
    },
    onStartOfTurn: () => {
      console.log('[FactChecker] onStartOfTurn received');
    },
    onTranscript: (transcript) => {
      console.log('[FactChecker] onTranscript:', transcript);
    },
  });

  // Map streaming status to scanner status
  const status: ScannerStatus =
    streamingStatus === 'streaming' ? 'listening' :
    streamingStatus === 'connecting' ? 'processing' : 'idle';

  const startListening = useCallback(async () => {
    console.log('[FactChecker] startListening called');
    setError(null);
    sessionIdRef.current = `session-${Date.now()}`;
    console.log('[FactChecker] starting liveActivity...');
    await liveActivity.start(sessionIdRef.current);
    console.log('[FactChecker] liveActivity started, starting streaming...');
    await startStreaming();
    console.log('[FactChecker] streaming started');
  }, [startStreaming]);

  const stopListening = useCallback(async () => {
    console.log('[FactChecker] stopListening called');
    await stopStreaming();
    console.log('[FactChecker] streaming stopped');
    await liveActivity.end();
    console.log('[FactChecker] liveActivity ended');
  }, [stopStreaming]);

  // Listen for Live Activity dismissal (user swiped away)
  const stopListeningRef = useRef(stopListening);
  stopListeningRef.current = stopListening;

  useEffect(() => {
    liveActivity.onDismissed(() => {
      console.log('[FactChecker] Live Activity dismissed, stopping...');
      stopListeningRef.current();
    });

    return () => {
      liveActivity.removeOnDismissed();
    };
  }, []);

  const toggleListening = useCallback(async () => {
    console.log('[FactChecker] toggleListening called, isStreaming:', isStreaming);
    if (isStreaming) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [isStreaming, startListening, stopListening]);

  const addClaim = useCallback(async (claim: FactCheck) => {
    setClaims(prev => [claim, ...prev]);
    await liveActivity.update(claim.claim);
  }, []);

  const clearClaims = useCallback(() => {
    setClaims([]);
  }, []);

  const processTranscript = useCallback(async (transcript: string) => {
    console.log('[FactChecker] processTranscript called with:', transcript?.slice(0, 50));
    if (!transcript?.trim()) {
      console.log('[FactChecker] empty transcript, skipping');
      return;
    }
    setError(null);

    try {
      console.log('[FactChecker] calling geminiService...');
      const factChecks = await geminiService.factCheckTranscript(transcript);
      console.log('[FactChecker] gemini returned:', factChecks?.length, 'results');
      for (const check of factChecks) {
        console.log('[FactChecker] adding claim:', check.claim);
        setClaims(prev => [check, ...prev]);
        await liveActivity.update(check.claim);
      }
    } catch (err) {
      console.log('[FactChecker] processTranscript ERROR:', err);
      setError(err instanceof Error ? err.message : 'Fact-check failed');
    }
  }, []);

  // Wire up processTranscript to ref for onEndOfTurn callback
  processTranscriptRef.current = processTranscript;

  return {
    status,
    claims,
    error: error || streamingError,
    currentTranscript,
    toggleListening,
    addClaim,
    clearClaims,
    processTranscript,
    isListening: isStreaming,
  };
}
