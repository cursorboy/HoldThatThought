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
  private audioChunksSent = 0;

  connect(config: FluxServiceConfig = {}): Promise<void> {
    console.log('[DeepgramFlux] connect called');
    this.config = config;
    this.audioChunksSent = 0;
    const sampleRate = config.sampleRate || 16000;
    const eotThreshold = config.eotThreshold || 0.7;

    const params = new URLSearchParams({
      model: 'flux-general-en',
      encoding: 'linear16',
      sample_rate: sampleRate.toString(),
      eot_threshold: eotThreshold.toString(),
    });

    const wsUrl = `${FLUX_WS_URL}?${params}`;
    console.log('[DeepgramFlux] connecting to:', wsUrl);
    console.log('[DeepgramFlux] API key present:', !!DEEPGRAM_API_KEY, 'length:', DEEPGRAM_API_KEY?.length);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(
          wsUrl,
          ['token', DEEPGRAM_API_KEY]
        );
        console.log('[DeepgramFlux] WebSocket created');

        this.ws.onopen = () => {
          console.log('[DeepgramFlux] WebSocket onopen');
          this.isConnected = true;
          this.config.onConnected?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          console.log('[DeepgramFlux] onmessage:', event.data);
          this.handleMessage(event.data);
        };

        this.ws.onerror = (event) => {
          console.log('[DeepgramFlux] onerror:', event);
          const error = new Error('WebSocket error');
          this.config.onError?.(error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('[DeepgramFlux] onclose, code:', event.code, 'reason:', event.reason);
          this.isConnected = false;
        };
      } catch (err) {
        console.log('[DeepgramFlux] connect ERROR:', err);
        reject(err);
      }
    });
  }

  private handleMessage(data: string) {
    try {
      const message: FluxMessage = JSON.parse(data);
      console.log('[DeepgramFlux] handleMessage type:', message.type, 'event:', message.event);

      if (message.type === 'Connected') {
        console.log('[DeepgramFlux] Connected message received');
        return;
      }

      if (message.type === 'TurnInfo') {
        const turnIndex = message.turn_index ?? 0;
        console.log('[DeepgramFlux] TurnInfo event:', message.event, 'turnIndex:', turnIndex);

        switch (message.event) {
          case 'StartOfTurn':
            console.log('[DeepgramFlux] StartOfTurn');
            this.config.onStartOfTurn?.(turnIndex);
            break;

          case 'EndOfTurn':
            console.log('[DeepgramFlux] EndOfTurn, transcript:', message.transcript);
            if (message.transcript) {
              this.config.onEndOfTurn?.(message.transcript, turnIndex);
            }
            break;

          default:
            if (message.transcript) {
              console.log('[DeepgramFlux] interim transcript:', message.transcript);
              this.config.onTranscript?.(message.transcript, false);
            }
        }
      }
    } catch (err) {
      console.error('[DeepgramFlux] Failed to parse message:', err);
    }
  }

  sendAudio(chunk: ArrayBuffer | Uint8Array) {
    if (!this.ws || !this.isConnected) {
      if (this.audioChunksSent === 0) {
        console.log('[DeepgramFlux] sendAudio: not connected, dropping chunk');
      }
      return;
    }

    this.audioChunksSent++;
    if (this.audioChunksSent % 50 === 1) {
      console.log('[DeepgramFlux] sendAudio chunk #', this.audioChunksSent, 'size:', chunk.byteLength);
    }

    try {
      this.ws.send(chunk);
    } catch (err) {
      console.error('[DeepgramFlux] Failed to send audio:', err);
    }
  }

  disconnect() {
    console.log('[DeepgramFlux] disconnect called');
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    console.log('[DeepgramFlux] disconnected');
  }

  get connected() {
    return this.isConnected;
  }
}

export const deepgramFlux = new DeepgramFluxService();
