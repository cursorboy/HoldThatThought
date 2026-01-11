import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { AudioModule, useAudioRecorder, RecordingPresets } from 'expo-audio';
import { File } from 'expo-file-system/next';
import LiveAudioStream from 'react-native-live-audio-stream';
import { Buffer } from 'buffer';
import { deepgramFlux } from '../services/deepgramFlux';
import { deepgramService } from '../services/deepgram';
import { StreamingStatus } from '../types';

// Set to false to use real-time streaming on all platforms
const useExpoAudioFallback = false;

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
  const audioChunkCount = useRef(0);

  const sampleRate = options.sampleRate || 16000;

  // expo-audio recorder for iOS fallback
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  console.log('[FluxTranscription] hook init, platform:', Platform.OS, 'useExpoAudio:', useExpoAudioFallback);

  // === iOS: expo-audio based recording ===
  const startStreamingIOS = useCallback(async () => {
    console.log('[FluxTranscription:iOS] startStreaming called');
    try {
      setError(null);
      setStatus('connecting');

      const permission = await AudioModule.requestRecordingPermissionsAsync();
      console.log('[FluxTranscription:iOS] permission:', permission);
      if (!permission.granted) {
        throw new Error('Microphone permission denied');
      }

      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      console.log('[FluxTranscription:iOS] audio mode set');

      await recorder.prepareToRecordAsync();
      console.log('[FluxTranscription:iOS] recorder prepared');

      recorder.record();
      console.log('[FluxTranscription:iOS] recording started');

      setStatus('streaming');
      optionsRef.current.onStartOfTurn?.();
    } catch (err) {
      console.log('[FluxTranscription:iOS] ERROR:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setStatus('error');
    }
  }, [recorder]);

  const stopStreamingIOS = useCallback(async () => {
    console.log('[FluxTranscription:iOS] stopStreaming called');
    try {
      setStatus('connecting'); // show processing state

      await recorder.stop();
      console.log('[FluxTranscription:iOS] recorder stopped');

      await AudioModule.setAudioModeAsync({
        allowsRecording: false,
      });

      const uri = recorder.uri;
      console.log('[FluxTranscription:iOS] recording uri:', uri);

      if (uri) {
        console.log('[FluxTranscription:iOS] transcribing audio...');
        const file = new File(uri);
        const base64 = await file.base64();
        console.log('[FluxTranscription:iOS] base64 length:', base64.length);

        const segment = await deepgramService.transcribeAudio(base64);
        console.log('[FluxTranscription:iOS] transcription result:', segment);

        if (segment?.text) {
          setCurrentTranscript(segment.text);
          setTurnIndex(prev => prev + 1);
          optionsRef.current.onEndOfTurn?.(segment.text);
        }
      }

      setStatus('idle');
    } catch (err) {
      console.log('[FluxTranscription:iOS] stopStreaming ERROR:', err);
      setError(err instanceof Error ? err.message : 'Transcription failed');
      setStatus('error');
    }
  }, [recorder]);

  // === Android: LiveAudioStream based real-time streaming ===
  const initAudioStreamAndroid = useCallback(() => {
    console.log('[FluxTranscription:Android] initializing LiveAudioStream');
    LiveAudioStream.init({
      sampleRate,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6, // VOICE_RECOGNITION
      bufferSize: 2560,
    });
  }, [sampleRate]);

  useEffect(() => {
    if (useExpoAudioFallback) return; // Skip for iOS

    console.log('[FluxTranscription:Android] registering audio data handler');
    const handleAudioData = (base64Data: string) => {
      if (!base64Data || base64Data.length === 0) return;
      audioChunkCount.current++;
      const chunk = Buffer.from(base64Data, 'base64');
      if (chunk.length === 0) return;
      if (audioChunkCount.current % 50 === 1) {
        console.log('[FluxTranscription:Android] chunk #', audioChunkCount.current, 'size:', chunk.length);
      }
      deepgramFlux.sendAudio(chunk);
    };

    LiveAudioStream.on('data', handleAudioData);

    return () => {
      LiveAudioStream.stop();
      deepgramFlux.disconnect();
    };
  }, []);

  const startStreamingAndroid = useCallback(async () => {
    console.log('[FluxTranscription:Android] startStreaming called');
    audioChunkCount.current = 0;
    try {
      setError(null);
      setStatus('connecting');

      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Microphone permission denied');
      }

      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await deepgramFlux.connect({
        sampleRate,
        onConnected: () => {
          console.log('[FluxTranscription:Android] connected');
          setStatus('streaming');
        },
        onStartOfTurn: (idx) => {
          setTurnIndex(idx);
          optionsRef.current.onStartOfTurn?.();
        },
        onEndOfTurn: (transcript, idx) => {
          const callbackTime = Date.now();
          console.log(`[FluxTranscription] ⏱️ onEndOfTurn callback received at ${callbackTime}`);
          setTurnIndex(idx);
          setCurrentTranscript(transcript);
          optionsRef.current.onEndOfTurn?.(transcript);
          console.log(`[FluxTranscription] ⏱️ onEndOfTurn forwarded at ${Date.now()}`);
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

      initAudioStreamAndroid();
      LiveAudioStream.start();
      setStatus('streaming');
    } catch (err) {
      console.log('[FluxTranscription:Android] ERROR:', err);
      setError(err instanceof Error ? err.message : 'Failed to start streaming');
      setStatus('error');
    }
  }, [sampleRate, initAudioStreamAndroid]);

  const stopStreamingAndroid = useCallback(async () => {
    console.log('[FluxTranscription:Android] stopStreaming called');
    try {
      LiveAudioStream.stop();
      deepgramFlux.disconnect();
      await AudioModule.setAudioModeAsync({ allowsRecording: false });
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop streaming');
    }
  }, []);

  // === Platform-agnostic API ===
  const startStreaming = useExpoAudioFallback ? startStreamingIOS : startStreamingAndroid;
  const stopStreaming = useExpoAudioFallback ? stopStreamingIOS : stopStreamingAndroid;

  const toggleStreaming = useCallback(() => {
    console.log('[FluxTranscription] toggle, status:', status);
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
