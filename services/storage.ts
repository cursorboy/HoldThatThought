import AsyncStorage from '@react-native-async-storage/async-storage';
import { TranscriptionSession } from '../types';

const SESSIONS_KEY = 'transcription_sessions';

export async function saveSessions(sessions: TranscriptionSession[]): Promise<void> {
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export async function loadSessions(): Promise<TranscriptionSession[]> {
  const data = await AsyncStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
}
