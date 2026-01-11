import { FactCheck, Verdict } from '../types';
import { GEMINI_API_KEY } from '../config';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-3-flash';

interface GeminiClaimResponse {
  claims: Array<{
    claim: string;
    verdict: 'true' | 'false' | 'partial' | 'unverified';
    confidence: number;
    explanation: string;
    sources: Array<{ title: string; url: string }>;
  }>;
}

class GeminiService {
  private apiKey: string = GEMINI_API_KEY;

  async factCheckTranscript(transcript: string): Promise<FactCheck[]> {
    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error('Add your Gemini API key in config.ts');
    }

    if (!transcript.trim()) return [];

    const prompt = this.buildPrompt(transcript);

    const response = await fetch(
      `${GEMINI_API_URL}/${MODEL}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
          tools: [{ googleSearch: {} }],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  private buildPrompt(transcript: string): string {
    return `Analyze this transcript for factual claims. For each claim:
1. Extract the exact claim statement
2. Research its accuracy using web search
3. Provide verdict: "true", "false", "partial", or "unverified"
4. Confidence 0-1
5. Brief explanation (1-2 sentences)
6. Include source URLs when available

Transcript: "${transcript}"

Return JSON: {"claims": [{"claim": "...", "verdict": "...", "confidence": 0.X, "explanation": "...", "sources": [{"title": "...", "url": "..."}]}]}

Only include verifiable factual claims (stats, dates, names, events). Skip opinions. If no claims found, return {"claims": []}.`;
  }

  private parseResponse(data: any): FactCheck[] {
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return [];

    try {
      const parsed: GeminiClaimResponse = JSON.parse(text);
      const timestamp = Date.now();

      return parsed.claims.map((c, i) => ({
        id: `${timestamp}-${i}`,
        claim: c.claim,
        verdict: c.verdict as Verdict,
        confidence: c.confidence,
        explanation: c.explanation,
        sources: c.sources || [],
        timestamp,
      }));
    } catch {
      return [];
    }
  }
}

export const geminiService = new GeminiService();
