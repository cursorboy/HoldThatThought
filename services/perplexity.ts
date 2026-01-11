import { PERPLEXITY_API_KEY } from '../config';
import { FactCheck, Verdict } from '../types';

const API_URL = 'https://api.perplexity.ai/chat/completions';
const MODEL = 'sonar'; // Fast model with web search

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

class PerplexityService {
  private apiKey: string = PERPLEXITY_API_KEY;

  async factCheckTranscript(transcript: string): Promise<FactCheck[]> {
    const startTime = Date.now();
    console.log(`[Perplexity] ⏱️ START factCheckTranscript at ${startTime}`);
    console.log('[Perplexity] API key present:', !!this.apiKey, 'length:', this.apiKey?.length);

    if (!this.apiKey || this.apiKey === 'YOUR_PERPLEXITY_API_KEY_HERE') {
      console.log('[Perplexity] ERROR: API key not configured');
      throw new Error('Add your Perplexity API key in config.ts');
    }

    if (!transcript.trim()) {
      console.log('[Perplexity] empty transcript, returning []');
      return [];
    }

    const fetchStart = Date.now();
    console.log(`[Perplexity] ⏱️ Starting fetch at +${fetchStart - startTime}ms`);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: transcript },
        ],
        temperature: 0.2,
      }),
    });

    const fetchEnd = Date.now();
    console.log(`[Perplexity] ⏱️ Fetch completed in ${fetchEnd - fetchStart}ms, status: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      console.log('[Perplexity] API error:', error);
      throw new Error(`Perplexity API error: ${error}`);
    }

    const jsonStart = Date.now();
    const data = await response.json();
    console.log(`[Perplexity] ⏱️ JSON parse completed in ${Date.now() - jsonStart}ms`);
    console.log('[Perplexity] response data:', JSON.stringify(data).slice(0, 500));

    const parseStart = Date.now();
    const result = this.parseResponse(data);
    console.log(`[Perplexity] ⏱️ parseResponse completed in ${Date.now() - parseStart}ms`);
    console.log(`[Perplexity] ⏱️ TOTAL TIME: ${Date.now() - startTime}ms, ${result.length} results`);
    return result;
  }

  private parseResponse(data: any): FactCheck[] {
    console.log('[Perplexity] parseResponse called');
    const content = data.choices?.[0]?.message?.content || '';

    // Strip markdown code blocks if present
    let text = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

    console.log('[Perplexity] extracted text:', text?.slice(0, 300));
    if (!text) {
      console.log('[Perplexity] no text in response');
      return [];
    }

    try {
      const parsed: TopicInsight[] = JSON.parse(text);
      console.log('[Perplexity] parsed topics count:', parsed?.length);
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
      console.log('[Perplexity] parseResponse JSON parse error:', err);
      console.log('[Perplexity] raw content was:', text);
      return [];
    }
  }
}

export const perplexityService = new PerplexityService();
