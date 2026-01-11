import { FactCheck, Verdict } from '../types';
import { GEMINI_API_KEY } from '../config';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.0-flash';

const SYSTEM_PROMPT = `You are an LLM model whose task is to offer helpful insights into the core topics of a conversation. Each prompt will be a transcript of a part of the conversation; please extract topics of interest that you think the conversation is/will be focused on, as well as any questions the participants may have asked or topics they seem unsure about, then search the web for salient information about that topic.

Please always match the following schema (array of JSON objects):
[
    {
        "topic": <TOPIC>,
        "info": <INFO>
    },
]

Please do not include ANY OTHER INFORMATION OR TEXT besides this formatted information in your response. The response should be ONLY this JSON format, so it can be passed to a JSON parser. Please also ensure that the <TOPIC> field matches exactly to what you searched to find the corresponding information.

For example, if the transcript contains the text "I love the Aventador ... which engine did the Aventador have again?", then a sample response could be
[
    {
        "topic": "Lamborghini Aventador engine",
        "info": "6.5-liter V12 engine"
    }
]`;

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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
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
