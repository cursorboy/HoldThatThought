import { DEEPGRAM_API_KEY } from '../config';
import { TranscriptSegment } from '../types';

interface DeepgramResponse {
  channel?: {
    alternatives: {
      transcript: string;
      words?: {
        word: string;
        start: number;
        end: number;
        confidence: number;
      }[];
    }[];
  };
  results?: {
    is_final?: boolean;
    channels?: {
      alternatives: {
        transcript: string;
        words?: {
          word: string;
          start: number;
          end: number;
          confidence: number;
        }[];
      }[];
    }[];
  };
  is_final?: boolean;
}

type TranscriptCallback = (segment: TranscriptSegment) => void;

class DeepgramService {
  private apiKey: string = DEEPGRAM_API_KEY;
  private streamingWebSocket: WebSocket | null = null;
  private transcriptCallback: TranscriptCallback | null = null;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;

  startStreaming(onTranscript: TranscriptCallback): Promise<void> {
    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error('Add your Deepgram API key in config.ts');
    }

    return new Promise((resolve, reject) => {
      this.transcriptCallback = onTranscript;

      this.streamingWebSocket = new WebSocket(
        'wss://api.deepgram.com/v2/listen?model=flux-general-en&encoding=linear16&sample_rate=16000',
        ['token', this.apiKey]
      );

      this.streamingWebSocket.onopen = () => {
        // Start keep-alive to maintain connection during silence
        this.startKeepAlive();
        resolve();
      };

      this.streamingWebSocket.onmessage = (event) => {
        try {
          const message: DeepgramResponse = JSON.parse(event.data as string);
          
          // Handle both response formats: direct channel or results.channels
          const channel = message.channel || message.results?.channels?.[0];
          const transcript = channel?.alternatives?.[0]?.transcript;
          const isFinal = message.is_final ?? message.results?.is_final ?? false;
          
          if (transcript && this.transcriptCallback) {
            const words = channel.alternatives[0].words || [];
            const startTime = words.length > 0 ? words[0].start : Date.now() / 1000;
            
            const segment: TranscriptSegment = {
              text: transcript,
              timestamp: startTime,
              isFinal: isFinal,
            };

            this.transcriptCallback(segment);
          }
        } catch (error) {
          console.error('Error parsing Deepgram response:', error);
        }
      };

      this.streamingWebSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(new Error('WebSocket connection error'));
      };

      this.streamingWebSocket.onclose = () => {
        this.stopKeepAlive();
        this.transcriptCallback = null;
      };
    });
  }

  sendAudioChunk(audioChunk: Uint8Array | ArrayBuffer): void {
    if (this.streamingWebSocket && this.streamingWebSocket.readyState === WebSocket.OPEN) {
      this.streamingWebSocket.send(audioChunk);
    }
  }

  stopStreaming(): void {
    if (this.streamingWebSocket) {
      // Send CloseStream message to signal end of audio
      if (this.streamingWebSocket.readyState === WebSocket.OPEN) {
        this.streamingWebSocket.send(JSON.stringify({ type: 'CloseStream' }));
      }
      this.streamingWebSocket.close();
      this.streamingWebSocket = null;
    }
    this.stopKeepAlive();
    this.transcriptCallback = null;
  }

  private startKeepAlive(): void {
    this.keepAliveInterval = setInterval(() => {
      if (this.streamingWebSocket && this.streamingWebSocket.readyState === WebSocket.OPEN) {
        this.streamingWebSocket.send(JSON.stringify({ type: 'KeepAlive' }));
      }
    }, 5000); // Send every 5 seconds
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  async transcribeAudio(audioBase64: string): Promise<TranscriptSegment | null> {
    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error('Add your Deepgram API key in config.ts');
    }

    // Convert base64 to ArrayBuffer
    const binaryString = atob(audioBase64);
    const audioBuffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      audioBuffer[i] = binaryString.charCodeAt(i);
    }

    return new Promise((resolve, reject) => {
      let finalTranscript: TranscriptSegment | null = null;
      let lastInterimTranscript: TranscriptSegment | null = null;

      const websocket = new WebSocket(
        'wss://api.deepgram.com/v2/listen?model=flux-general-en&encoding=linear16&sample_rate=16000',
        ['token', this.apiKey]
      );

      websocket.onopen = () => {
        // Send audio data
        websocket.send(audioBuffer);
        
        // Send CloseStream message to signal end of audio
        websocket.send(JSON.stringify({ type: 'CloseStream' }));
      };

      websocket.onmessage = (event) => {
        try {
          const message: DeepgramResponse = JSON.parse(event.data as string);
          
          // Handle both response formats: direct channel or results.channels
          const channel = message.channel || message.results?.channels?.[0];
          const transcript = channel?.alternatives?.[0]?.transcript;
          const isFinal = message.is_final ?? message.results?.is_final ?? false;
          
          if (transcript) {
            const words = channel.alternatives[0].words || [];
            const startTime = words.length > 0 ? words[0].start : Date.now() / 1000;
            
            const segment: TranscriptSegment = {
              text: transcript,
              timestamp: startTime,
              isFinal: isFinal,
            };

            if (isFinal) {
              finalTranscript = segment;
            } else {
              lastInterimTranscript = segment;
            }
          }
        } catch (error) {
          console.error('Error parsing Deepgram response:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(new Error('WebSocket connection error'));
      };

      websocket.onclose = () => {
        // Resolve with final transcript, or last interim if no final was received
        resolve(finalTranscript || lastInterimTranscript);
      };

      // Set a timeout to prevent hanging indefinitely
      setTimeout(() => {
        if (websocket.readyState === WebSocket.OPEN || websocket.readyState === WebSocket.CONNECTING) {
          websocket.close();
          resolve(finalTranscript || lastInterimTranscript);
        }
      }, 30000); // 30 second timeout
    });
  }
}

export const deepgramService = new DeepgramService();