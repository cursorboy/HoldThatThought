import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { useRef, useEffect } from 'react';
import { RecordingStatus } from '../types';

interface TranscriptViewProps {
  transcript: string;
  status: RecordingStatus;
}

export function TranscriptView({ transcript, status }: TranscriptViewProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [transcript]);

  const statusText = {
    idle: 'Tap to record',
    recording: 'Listening...',
    processing: 'Transcribing...',
    error: 'Error occurred',
  }[status];

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{statusText}</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        {transcript ? (
          <Text style={styles.transcript}>{transcript}</Text>
        ) : (
          <Text style={styles.placeholder}>
            Your transcription will appear here
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  status: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
  },
  content: {
    padding: 20,
    minHeight: 200,
  },
  transcript: {
    fontSize: 18,
    color: '#fff',
    lineHeight: 28,
  },
  placeholder: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
