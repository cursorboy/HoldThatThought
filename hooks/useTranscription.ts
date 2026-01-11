import { AudioModule, RecordingPresets, useAudioRecorder } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { deepgramService } from '../services/deepgram';
import { RecordingStatus, TranscriptSegment } from '../types';

// Check if MediaRecorder is available (web platforms only)
const isMediaRecorderAvailable = (): boolean => {
  return (
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices !== undefined &&
    navigator.mediaDevices.getUserMedia !== undefined &&
    typeof MediaRecorder !== 'undefined'
  );
};

export function useTranscription() {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStreamingRef = useRef<boolean>(false);

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

      // Only start streaming if MediaRecorder is available (web platforms)
      if (isMediaRecorderAvailable()) {
        isStreamingRef.current = true;
        
        // Start streaming transcription
        await deepgramService.startStreaming((segment: TranscriptSegment) => {
          setSegments(prev => {
            if (segment.isFinal) {
              // Remove any interim segments and add final segment
              const finalSegments = prev.filter(s => s.isFinal);
              const newSegments = [...finalSegments, segment];
              
              // Update transcript: all final segments combined
              const newTranscript = newSegments.map(s => s.text).join(' ');
              setTranscript(newTranscript);
              
              return newSegments;
            } else {
              // Update interim transcript (replace last interim if exists)
              const lastInterimIndex = prev.findIndex(s => !s.isFinal);
              let newSegments: TranscriptSegment[];
              
              if (lastInterimIndex !== -1) {
                newSegments = [...prev];
                newSegments[lastInterimIndex] = segment;
              } else {
                newSegments = [...prev, segment];
              }
              
              // Update transcript: all final segments + current interim
              const finalSegments = newSegments.filter(s => s.isFinal);
              const finalText = finalSegments.map(s => s.text).join(' ');
              const interimText = segment.text;
              setTranscript(finalText ? `${finalText} ${interimText}` : interimText);
              
              return newSegments;
            }
          });
        });

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          
          // Try different MIME types for better compatibility
          let mimeType = 'audio/webm;codecs=opus';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/webm';
          }
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4';
          }
          
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
          });
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = async (event) => {
            if (event.data.size > 0) {
              try {
                const arrayBuffer = await event.data.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                deepgramService.sendAudioChunk(uint8Array);
              } catch (err) {
                console.error('Error sending audio chunk:', err);
              }
            }
          };

          mediaRecorder.start(100); // Send chunks every 100ms
          console.log('MediaRecorder started for live transcription');
        } catch (mediaErr) {
          console.warn('MediaRecorder setup failed:', mediaErr);
          deepgramService.stopStreaming();
          isStreamingRef.current = false;
        }
      } else {
        // On native platforms (iOS/Android), MediaRecorder is not available
        // NOTE: True real-time streaming on iOS native is not possible with expo-audio alone
        // because expo-audio records to compressed formats (m4a) while Deepgram expects raw PCM.
        // For true real-time on iOS, you would need:
        // 1. Native modules using AVAudioEngine (Swift/Objective-C)
        // 2. A library like react-native-deepgram that handles this natively
        // 
        // For now, we establish the streaming connection but cannot send audio in real-time.
        // The WebSocket connection will be established but no audio chunks will be sent.
        console.warn('Real-time streaming on iOS native requires native modules. Consider using react-native-deepgram or native modules for true real-time transcription.');
        isStreamingRef.current = false; // Don't actually stream on native platforms
        await deepgramService.startStreaming((segment: TranscriptSegment) => {
          setSegments(prev => {
            if (segment.isFinal) {
              // Remove any interim segments and add final segment
              const finalSegments = prev.filter(s => s.isFinal);
              const newSegments = [...finalSegments, segment];
              
              // Update transcript: all final segments combined
              const newTranscript = newSegments.map(s => s.text).join(' ');
              setTranscript(newTranscript);
              
              return newSegments;
            } else {
              // Update interim transcript (replace last interim if exists)
              const lastInterimIndex = prev.findIndex(s => !s.isFinal);
              let newSegments: TranscriptSegment[];
              
              if (lastInterimIndex !== -1) {
                newSegments = [...prev];
                newSegments[lastInterimIndex] = segment;
              } else {
                newSegments = [...prev, segment];
              }
              
              // Update transcript: all final segments + current interim
              const finalSegments = newSegments.filter(s => s.isFinal);
              const finalText = finalSegments.map(s => s.text).join(' ');
              const interimText = segment.text;
              setTranscript(finalText ? `${finalText} ${interimText}` : interimText);
              
              return newSegments;
            }
          });
        });
        
        console.log('Starting file polling for real-time transcription on native platform');
      }
      
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus('recording');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setStatus('error');
      if (isStreamingRef.current) {
        deepgramService.stopStreaming();
        isStreamingRef.current = false;
      }
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    try {
      setStatus('processing');

      // Stop MediaRecorder if it was used (web platforms)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      // Stop media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      await recorder.stop();

      await AudioModule.setAudioModeAsync({
        allowsRecording: false,
      });

      // If we were streaming, stop the stream
      if (isStreamingRef.current) {
        deepgramService.stopStreaming();
        isStreamingRef.current = false;
        setStatus('idle');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
      setStatus('error');
      if (isStreamingRef.current) {
        deepgramService.stopStreaming();
        isStreamingRef.current = false;
      }
    }
  }, [recorder]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setSegments([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (isStreamingRef.current) {
        deepgramService.stopStreaming();
      }
    };
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
