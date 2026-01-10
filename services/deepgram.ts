import { TranscriptSegment } from '../types';
import { DEEPGRAM_API_KEY } from '../config';

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';

interface DeepgramResponse {
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string;
        confidence: number;
        words: Array<{
          word: string;
          start: number;
          end: number;
          confidence: number;
        }>;
      }>;
    }>;
  };
}

class DeepgramService {
  private apiKey: string = DEEPGRAM_API_KEY;

  async transcribeAudio(audioBase64: string): Promise<TranscriptSegment | null> {
    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error('Add your Deepgram API key in config.ts');
    }

    const audioBuffer = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));

    const params = new URLSearchParams({
      model: 'nova-2',
      language: 'en',
      smart_format: 'true',
      punctuate: 'true',
    });

    const response = await fetch(`${DEEPGRAM_API_URL}?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'audio/wav',
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Deepgram API error: ${error}`);
    }

    const data: DeepgramResponse = await response.json();
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    if (!transcript) return null;

    return {
      text: transcript,
      timestamp: Date.now(),
      isFinal: true,
    };
  }
}

export const deepgramService = new DeepgramService();
