import { useState, useCallback, useRef } from 'react';
import { FactCheck, ScannerStatus } from '../types';
import { liveActivity } from '../services/liveActivity';
import { geminiService } from '../services/gemini';
import { useFluxTranscription } from './useFluxTranscription';

export function useFactChecker() {
  const [claims, setClaims] = useState<FactCheck[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);
  const processTranscriptRef = useRef<(t: string) => Promise<void>>(undefined);

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
      console.log('[Flux] EndOfTurn:', transcript);
      processTranscriptRef.current?.(transcript);
    },
  });

  // Map streaming status to scanner status
  const status: ScannerStatus =
    streamingStatus === 'streaming' ? 'listening' :
    streamingStatus === 'connecting' ? 'processing' : 'idle';

  const startListening = useCallback(async () => {
    setError(null);
    sessionIdRef.current = `session-${Date.now()}`;
    await liveActivity.start(sessionIdRef.current);
    await startStreaming();
  }, [startStreaming]);

  const stopListening = useCallback(async () => {
    await stopStreaming();
    await liveActivity.end();
  }, [stopStreaming]);

  const toggleListening = useCallback(async () => {
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
    if (!transcript.trim()) return;
    setError(null);

    try {
      const factChecks = await geminiService.factCheckTranscript(transcript);
      for (const check of factChecks) {
        setClaims(prev => [check, ...prev]);
        await liveActivity.update(check.claim);
      }
    } catch (err) {
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
