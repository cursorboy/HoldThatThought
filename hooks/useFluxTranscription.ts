import { useState, useCallback, useRef, useEffect } from 'react';
import { AudioModule } from 'expo-audio';
import LiveAudioStream from 'react-native-live-audio-stream';
import { Buffer } from 'buffer';
import { deepgramFlux } from '../services/deepgramFlux';
import { StreamingStatus } from '../types';

interface UseFluxTranscriptionOptions {
  onEndOfTurn?: (transcript: string) => void;
  onStartOfTurn?: () => void;
  onTranscript?: (transcript: string) => void;
  sampleRate?: number;
}

export function useFluxTranscription(options: UseFluxTranscriptionOptions = {}) {
  const [status, setStatus] = useState<StreamingStatus>('idle');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [turnIndex, setTurnIndex] = useState(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const sampleRate = options.sampleRate || 16000;

  useEffect(() => {
    // Initialize audio stream config
    LiveAudioStream.init({
      sampleRate,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6, // VOICE_RECOGNITION on Android
      bufferSize: 2560, // ~80ms at 16kHz
      wavFile: '', // Not saving to file, just streaming
    });

    // Audio data handler
    const handleAudioData = (base64Data: string) => {
      const chunk = Buffer.from(base64Data, 'base64');
      deepgramFlux.sendAudio(chunk);
    };

    LiveAudioStream.on('data', handleAudioData);

    return () => {
      LiveAudioStream.stop();
      deepgramFlux.disconnect();
    };
  }, [sampleRate]);

  const startStreaming = useCallback(async () => {
    try {
      setError(null);
      setStatus('connecting');

      // Request mic permission
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Microphone permission denied');
      }

      // Set audio mode
      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Connect to Deepgram Flux
      await deepgramFlux.connect({
        sampleRate,
        onConnected: () => {
          setStatus('streaming');
        },
        onStartOfTurn: (idx) => {
          setTurnIndex(idx);
          optionsRef.current.onStartOfTurn?.();
        },
        onEndOfTurn: (transcript, idx) => {
          setTurnIndex(idx);
          setCurrentTranscript(transcript);
          optionsRef.current.onEndOfTurn?.(transcript);
        },
        onTranscript: (transcript) => {
          setCurrentTranscript(transcript);
          optionsRef.current.onTranscript?.(transcript);
        },
        onError: (err) => {
          setError(err.message);
          setStatus('error');
        },
      });

      // Start audio capture
      LiveAudioStream.start();
      setStatus('streaming');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start streaming');
      setStatus('error');
    }
  }, [sampleRate]);

  const stopStreaming = useCallback(async () => {
    try {
      LiveAudioStream.stop();
      deepgramFlux.disconnect();

      await AudioModule.setAudioModeAsync({
        allowsRecording: false,
      });

      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop streaming');
    }
  }, []);

  const toggleStreaming = useCallback(() => {
    if (status === 'streaming') {
      stopStreaming();
    } else if (status === 'idle') {
      startStreaming();
    }
  }, [status, startStreaming, stopStreaming]);

  return {
    status,
    currentTranscript,
    turnIndex,
    error,
    startStreaming,
    stopStreaming,
    toggleStreaming,
    isStreaming: status === 'streaming',
  };
}
