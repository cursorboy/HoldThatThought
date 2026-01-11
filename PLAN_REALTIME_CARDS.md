# Plan: Real-time Fact Cards

## Current Flow
```
Voice → Deepgram → onEndOfTurn → Gemini API → parse JSON → setClaims → render cards
```
Cards only appear AFTER a pause in speech (end of turn).

## Goal
Show cards in real-time AS user speaks, not just at end of turn.

---

## Implementation Approach

### Option A: Periodic Chunked Processing (Recommended)
Process transcript chunks every X seconds while listening.

### Option B: Gemini Streaming API
Stream responses as Gemini generates them. More complex, may not work well with search grounding.

---

## Detailed Steps (Option A)

### 1. Modify useFactChecker hook
- Add interval timer that fires every ~5-10 seconds during listening
- Track `lastProcessedText` to only send new content
- Process new chunks → append cards to claims array
- Keep existing onEndOfTurn as final cleanup

### 2. Update geminiService
- Add `processChunk(newText, previousContext)` method
- Include context about what was already processed to avoid duplicate insights
- Same JSON output format

### 3. Add deduplication logic
- Hash or compare new insights against existing claims
- Prevent duplicate cards for same topic
- Consider merging/updating existing cards with new info

### 4. UI updates
- Cards already animate in with FadeInDown
- Add "live" indicator or subtle pulse to newest card
- Consider temporary "processing" card placeholder

### 5. State management tweaks
- Add `isProcessingChunk` state to prevent overlapping API calls
- Queue chunks if needed

---

## Files to Modify

| File | Changes |
|------|---------|
| `hooks/useFactChecker.ts` | Add interval timer, chunk tracking, deduplication |
| `services/gemini.ts` | Add chunk processing method with context |
| `components/ClaimCard.tsx` | Optional: add "new" indicator animation |
| `types/index.ts` | Add any new types if needed |

---

## Clarifying Questions

1. **Chunk interval**: How frequently should we send chunks to Gemini? (5s, 10s, 15s?)
   - Shorter = more responsive but more API calls
   - Longer = fewer calls but delayed cards

2. **During silence**: Should processing pause if user stops talking mid-sentence?

3. **Duplicate handling**: If Gemini returns same topic with updated info, should we:
   - Keep both cards?
   - Update existing card?
   - Only keep newer version?

4. **Processing indicator**: Show a "analyzing..." card/loader while waiting for Gemini response?

5. **API cost concern**: More frequent calls = higher cost. Is this acceptable?
