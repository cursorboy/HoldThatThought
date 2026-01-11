import { GEMINI_API_KEY } from '../config';
import { FactCheck, Verdict } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-3-flash-preview';

const SYSTEM_PROMPT = `You fact-check conversations. ONLY extract statements that make a specific factual claim that could be TRUE or FALSE. Ignore casual conversation, opinions, and filler.

ONLY respond to:
- Specific factual claims ("X is Y", "X has Y", "X was the first to...")
- Questions asking for facts ("How many...", "Who was...", "When did...")

DO NOT respond to:
- Casual speech ("I think...", "maybe...", "that's cool")
- Opinions or preferences
- Incomplete sentences
- General topics without a verifiable claim

Output JSON array. Return [] if nothing to fact-check.
[{"topic": "<short label>", "info": "<brief correction or answer>"}]

Example - "Donald Trump was the third president":
[{"topic": "Trump presidency", "info": "Donald Trump was the 45th president, not the third."}]

Example - "I love birds, they're so cool":
[]`;

interface TopicInsight {
  topic: string;
  info: string;
}

class GeminiService {
  private apiKey: string = GEMINI_API_KEY;

  async factCheckTranscript(transcript: string): Promise<FactCheck[]> {
    console.log('[Gemini] factCheckTranscript called');
    console.log('[Gemini] API key present:', !!this.apiKey, 'length:', this.apiKey?.length);

    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
      console.log('[Gemini] ERROR: API key not configured');
      throw new Error('Add your Gemini API key in config.ts');
    }

    if (!transcript.trim()) {
      console.log('[Gemini] empty transcript, returning []');
      return [];
    }

    console.log('[Gemini] sending request to API...');

    const response = await fetch(
      `${GEMINI_API_URL}/${MODEL}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: transcript }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
          tools: [{ googleSearch: {} }],
        }),
      }
    );
    console.log('[Gemini] response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.log('[Gemini] API error:', error);
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    console.log('[Gemini] response data:', JSON.stringify(data).slice(0, 500));
    const result = this.parseResponse(data);
    console.log('[Gemini] parsed result:', result);
    return result;
  }

  private parseResponse(data: any): FactCheck[] {
    console.log('[Gemini] parseResponse called');
    const parts = data.candidates?.[0]?.content?.parts || [];
    // Combine all parts and strip markdown code blocks
    let text = parts.map((p: any) => p.text || '').join('');
    text = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

    // Extract only the first JSON array (Gemini sometimes returns duplicates)
    // Find where second array starts: ]\n[ or ][ pattern
    const secondArrayIdx = text.search(/\]\s*\[/);
    if (secondArrayIdx !== -1) {
      text = text.slice(0, secondArrayIdx + 1); // include the first ]
    }

    console.log('[Gemini] extracted text:', text?.slice(0, 300));
    if (!text) {
      console.log('[Gemini] no text in response');
      return [];
    }

    try {
      const parsed: TopicInsight[] = JSON.parse(text);
      console.log('[Gemini] parsed topics count:', parsed?.length);
      const timestamp = Date.now();

      return parsed.map((item, i) => ({
        id: `${timestamp}-${i}`,
        claim: item.topic,
        verdict: 'unverified' as Verdict,
        confidence: 1,
        explanation: item.info,
        sources: [],
        timestamp,
      }));
    } catch (err) {
      console.log('[Gemini] parseResponse JSON parse error:', err);
      return [];
    }
  }
}

export const geminiService = new GeminiService();
