import { GROQ_API_KEY } from '../config';
import { FactCheck, Verdict } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile'; // No web search, super fast

const SYSTEM_PROMPT = `You fact-check conversations. ONLY extract statements that make a specific factual claim that could be TRUE or FALSE. Ignore casual conversation, opinions, and filler.

ONLY respond to:
- Specific factual claims ("X is Y", "X has Y", "X was the first to...")
- Questions asking for facts ("How many...", "Who was...", "When did...")

DO NOT respond to:
- Casual speech ("I think...", "maybe...", "that's cool")
- Opinions or preferences
- Incomplete sentences
- General topics without a verifiable claim

Use your knowledge to verify claims.

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

class GroqService {
  private apiKey: string = GROQ_API_KEY;

  async factCheckTranscript(transcript: string): Promise<FactCheck[]> {
    const startTime = Date.now();
    console.log(`[Groq] ⏱️ START factCheckTranscript at ${startTime}`);
    console.log('[Groq] API key present:', !!this.apiKey, 'length:', this.apiKey?.length);

    if (!this.apiKey || this.apiKey === 'YOUR_GROQ_API_KEY_HERE') {
      console.log('[Groq] ERROR: API key not configured');
      throw new Error('Add your Groq API key in config.ts');
    }

    if (!transcript.trim()) {
      console.log('[Groq] empty transcript, returning []');
      return [];
    }

    const fetchStart = Date.now();
    console.log(`[Groq] ⏱️ Starting fetch at +${fetchStart - startTime}ms`);

    const response = await fetch(GROQ_API_URL, {
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
    console.log(`[Groq] ⏱️ Fetch completed in ${fetchEnd - fetchStart}ms, status: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      console.log('[Groq] API error:', error);
      throw new Error(`Groq API error: ${error}`);
    }

    const jsonStart = Date.now();
    const data = await response.json();
    console.log(`[Groq] ⏱️ JSON parse completed in ${Date.now() - jsonStart}ms`);
    console.log('[Groq] response data:', JSON.stringify(data).slice(0, 500));

    const parseStart = Date.now();
    const result = this.parseResponse(data);
    console.log(`[Groq] ⏱️ parseResponse completed in ${Date.now() - parseStart}ms`);
    console.log(`[Groq] ⏱️ TOTAL TIME: ${Date.now() - startTime}ms, ${result.length} results`);
    return result;
  }

  private parseResponse(data: any): FactCheck[] {
    console.log('[Groq] parseResponse called');
    const content = data.choices?.[0]?.message?.content || '';

    // Strip markdown code blocks if present
    let text = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

    console.log('[Groq] extracted text:', text?.slice(0, 300));
    if (!text) {
      console.log('[Groq] no text in response');
      return [];
    }

    try {
      const parsed: TopicInsight[] = JSON.parse(text);
      console.log('[Groq] parsed topics count:', parsed?.length);
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
      console.log('[Groq] parseResponse JSON parse error:', err);
      console.log('[Groq] raw content was:', text);
      return [];
    }
  }
}

export const groqService = new GroqService();
