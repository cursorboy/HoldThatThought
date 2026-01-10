export interface TranscriptSegment {
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface TranscriptionSession {
  id: string;
  startTime: number;
  endTime?: number;
  transcript: string;
  segments: TranscriptSegment[];
}

export type RecordingStatus = 'idle' | 'recording' | 'processing' | 'error';
