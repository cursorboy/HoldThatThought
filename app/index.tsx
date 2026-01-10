import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranscription } from '../hooks/useTranscription';
import { RecordButton } from '../components/RecordButton';
import { TranscriptView } from '../components/TranscriptView';

export default function Index() {
  const {
    status,
    transcript,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useTranscription();

  const handleRecordPress = () => {
    if (status === 'recording') {
      stopRecording();
    } else if (status === 'idle') {
      startRecording();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>HoldThatThought</Text>
        {transcript && (
          <Pressable onPress={clearTranscript}>
            <Text style={styles.clearBtn}>Clear</Text>
          </Pressable>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      <View style={styles.content}>
        <TranscriptView transcript={transcript} status={status} />
      </View>

      <View style={styles.controls}>
        <RecordButton
          status={status}
          onPress={handleRecordPress}
          disabled={status === 'processing'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  clearBtn: {
    fontSize: 14,
    color: '#3b82f6',
  },
  errorContainer: {
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
  },
  error: {
    color: '#fca5a5',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  controls: {
    paddingVertical: 32,
    alignItems: 'center',
  },
});
