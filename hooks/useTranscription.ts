import { useState, useCallback } from 'react';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import { File } from 'expo-file-system/next';
import { deepgramService } from '../services/deepgram';
import { RecordingStatus, TranscriptSegment } from '../types';

export function useTranscription() {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Microphone permission denied');
      }

      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus('recording');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setStatus('error');
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    try {
      setStatus('processing');
      await recorder.stop();

      await AudioModule.setAudioModeAsync({
        allowsRecording: false,
      });

      const uri = recorder.uri;
      if (uri) {
        const file = new File(uri);
        const base64 = await file.base64();
        const segment = await deepgramService.transcribeAudio(base64);

        if (segment) {
          setSegments(prev => [...prev, segment]);
          setTranscript(prev => prev + (prev ? ' ' : '') + segment.text);
        }
      }

      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
      setStatus('error');
    }
  }, [recorder]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setSegments([]);
  }, []);

  return {
    status,
    transcript,
    segments,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
  };
}
