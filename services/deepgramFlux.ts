import { DEEPGRAM_API_KEY } from '../config';
import { FluxMessage, FluxEventType } from '../types';

const FLUX_WS_URL = 'wss://api.deepgram.com/v2/listen';

type FluxCallback = (transcript: string, turnIndex: number) => void;
type ErrorCallback = (error: Error) => void;

interface FluxServiceConfig {
  onEndOfTurn?: FluxCallback;
  onStartOfTurn?: (turnIndex: number) => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: ErrorCallback;
  onConnected?: () => void;
  eotThreshold?: number;
  sampleRate?: number;
}

class DeepgramFluxService {
  private ws: WebSocket | null = null;
  private config: FluxServiceConfig = {};
  private isConnected = false;

  connect(config: FluxServiceConfig = {}): Promise<void> {
    this.config = config;
    const sampleRate = config.sampleRate || 16000;
    const eotThreshold = config.eotThreshold || 0.7;

    const params = new URLSearchParams({
      model: 'flux-general-en',
      encoding: 'linear16',
      sample_rate: sampleRate.toString(),
      eot_threshold: eotThreshold.toString(),
    });

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(
          `${FLUX_WS_URL}?${params}`,
          ['token', DEEPGRAM_API_KEY]
        );

        this.ws.onopen = () => {
          this.isConnected = true;
          this.config.onConnected?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (event) => {
          const error = new Error('WebSocket error');
          this.config.onError?.(error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private handleMessage(data: string) {
    try {
      const message: FluxMessage = JSON.parse(data);

      if (message.type === 'Connected') {
        return;
      }

      if (message.type === 'TurnInfo') {
        const turnIndex = message.turn_index ?? 0;

        switch (message.event) {
          case 'StartOfTurn':
            this.config.onStartOfTurn?.(turnIndex);
            break;

          case 'EndOfTurn':
            if (message.transcript) {
              this.config.onEndOfTurn?.(message.transcript, turnIndex);
            }
            break;

          default:
            if (message.transcript) {
              this.config.onTranscript?.(message.transcript, false);
            }
        }
      }
    } catch (err) {
      console.error('Failed to parse Flux message:', err);
    }
  }

  sendAudio(chunk: ArrayBuffer | Uint8Array) {
    if (!this.ws || !this.isConnected) {
      return;
    }

    try {
      this.ws.send(chunk);
    } catch (err) {
      console.error('Failed to send audio:', err);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  get connected() {
    return this.isConnected;
  }
}

export const deepgramFlux = new DeepgramFluxService();
