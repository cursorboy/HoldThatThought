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
    console.log('[Deepgram] transcribeAudio called, base64 length:', audioBase64.length);

    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
      console.log('[Deepgram] ERROR: API key not configured');
      throw new Error('Add your Deepgram API key in config.ts');
    }
    console.log('[Deepgram] API key present, length:', this.apiKey.length);

    const audioBuffer = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    console.log('[Deepgram] audio buffer size:', audioBuffer.length);

    const params = new URLSearchParams({
      model: 'nova-2',
      language: 'en',
      smart_format: 'true',
      punctuate: 'true',
    });

    console.log('[Deepgram] sending request to API...');
    const response = await fetch(`${DEEPGRAM_API_URL}?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'audio/wav',
      },
      body: audioBuffer,
    });
    console.log('[Deepgram] response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.log('[Deepgram] API error:', error);
      throw new Error(`Deepgram API error: ${error}`);
    }

    const data: DeepgramResponse = await response.json();
    console.log('[Deepgram] response data:', JSON.stringify(data).slice(0, 200));
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    console.log('[Deepgram] transcript:', transcript);

    if (!transcript) return null;

    return {
      text: transcript,
      timestamp: Date.now(),
      isFinal: true,
    };
  }
}

export const deepgramService = new DeepgramService();
