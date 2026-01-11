export type Verdict = 'true' | 'false' | 'partial' | 'unverified';

export interface Source {
  title: string;
  url: string;
}

export interface FactCheck {
  id: string;
  claim: string;
  verdict: Verdict;
  confidence: number;
  explanation: string;
  sources: Source[];
  timestamp: number;
}

export type ScannerStatus = 'idle' | 'listening' | 'processing';

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

// Deepgram Flux types
export type FluxEventType = 'StartOfTurn' | 'EndOfTurn' | 'EagerEndOfTurn' | 'TurnResumed';

export interface FluxMessage {
  type: 'TurnInfo' | 'Connected';
  event?: FluxEventType;
  transcript?: string;
  turn_index?: number;
  audio_window_start?: number;
  audio_window_end?: number;
  end_of_turn_confidence?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

export type StreamingStatus = 'idle' | 'connecting' | 'streaming' | 'error';
