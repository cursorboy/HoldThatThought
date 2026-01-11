# Hold That Thought

Real-time fact-checking app that listens to conversations, transcribes speech, and instantly verifies factual claims with AI-powered web search.

## Features

- **Live Transcription** - Deepgram Flux streaming with end-of-turn detection
- **AI Fact-Checking** - Perplexity, Groq, or Gemini (configurable)
- **iOS Live Activity** - Dynamic Island + Lock Screen updates
- **Deep Dive** - Tap any claim for detailed research with sources
- **Dark/Light Theme** - System-aware theming

## How It Works

```
Tap mic → Audio streams to Deepgram → Transcription on pause →
LLM extracts claims → Fact-checks with web search → Live Activity updates
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React Native 0.81 + Expo 54 |
| Language | TypeScript |
| Routing | Expo Router v6 |
| Styling | TailwindCSS + NativeWind |
| Audio | expo-audio, react-native-live-audio-stream |
| Transcription | Deepgram Flux (WebSocket) |
| Fact-Check | Perplexity / Groq / Gemini |
| Animations | Reanimated 4 + Moti |
| Native | Swift (iOS Live Activities) |

## Project Structure

```
app/                    # Expo Router pages
components/             # UI components (MicButton, ClaimCard, etc)
services/               # API integrations
  ├── deepgramFlux.ts   # Real-time transcription
  ├── perplexity.ts     # Fact-checking (default)
  ├── groq.ts           # Fast fact-checking (no search)
  ├── gemini.ts         # Fact-checking + deep dive
  └── liveActivity.ts   # iOS native bridge
hooks/                  # React hooks
  ├── useFactChecker.ts # Main orchestration
  └── useFluxTranscription.ts
native-src/             # Swift code for Live Activities
config.ts               # API keys & provider selection
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure API keys** in `config.ts`:
   ```typescript
   export const DEEPGRAM_API_KEY = 'your-key';
   export const PERPLEXITY_API_KEY = 'your-key';
   export const GROQ_API_KEY = 'your-key';      // optional
   export const GEMINI_API_KEY = 'your-key';    // optional
   ```

3. **Run development build**
   ```bash
   npx expo prebuild
   npx expo run:ios
   # or
   npx expo run:android
   ```

## Configuration

Switch LLM providers in `config.ts`:

```typescript
export const LLM_PROVIDER: 'perplexity' | 'groq' | 'gemini' = 'perplexity';
```

| Provider | Speed | Web Search | Best For |
|----------|-------|------------|----------|
| Perplexity | ~2.5s | Yes | Default - fast + accurate |
| Groq | ~400ms | No | Speed (less accurate) |
| Gemini | ~4s | Yes | Deep research |

## iOS Live Activity

Requires iOS 16.2+. Shows:
- **Dynamic Island** - Mic icon + claim count (compact), full claim (expanded)
- **Lock Screen** - Current claim with timer

The app auto-stops when Live Activity is dismissed.

## Deep Links

```
holdthatthought://start-listening
holdthatthought://stop-listening
holdthatthought://toggle-listening
```

## API Response Format

All LLM services return:
```typescript
interface FactCheck {
  id: string;
  claim: string;           // Short topic label
  verdict: Verdict;        // 'true' | 'false' | 'partial' | 'unverified'
  confidence: number;
  explanation: string;     // Brief correction or answer
  sources: Source[];
  timestamp: number;
}
```

## Performance

Typical latency (end-to-end from speech to result):
- **Perplexity**: 2.2-3s (with web search)
- **Groq**: 200-500ms (no web search)
- **Gemini**: 2-6s (with web search)

## License

MIT
