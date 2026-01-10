import { Pressable, View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { RecordingStatus } from '../types';

interface RecordButtonProps {
  status: RecordingStatus;
  onPress: () => void;
  disabled?: boolean;
}

export function RecordButton({ status, onPress, disabled }: RecordButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const isRecording = status === 'recording';
  const isProcessing = status === 'processing';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isProcessing}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Animated.View
        style={[
          styles.inner,
          isRecording && styles.recording,
          isProcessing && styles.processing,
          { transform: [{ scale: isRecording ? pulseAnim : 1 }] },
        ]}
      >
        <View style={[styles.icon, isRecording && styles.stopIcon]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  inner: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recording: {
    backgroundColor: '#dc2626',
  },
  processing: {
    backgroundColor: '#6b7280',
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  stopIcon: {
    borderRadius: 4,
  },
});
