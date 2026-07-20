import { transcribeWithWords, type WhisperResult } from "../ai/transcription";
import { getAIProvider } from "../ai";
import { round } from "../ai/heuristics";
import type { TranscriptWord } from "../ai/types";

// Get a transcript with word timings for the editor. Prefers real Whisper word
// timestamps; if unavailable (no OpenAI key / offline / mock mode) it falls back
// to a synthesized transcript with evenly-spaced word timings so the editor
// still runs end-to-end.

export async function getFullTranscript(
  storageKey: string,
  sizeBytes: number,
  durationSec: number
): Promise<WhisperResult> {
  const real = await transcribeWithWords(storageKey, sizeBytes);
  if (real && real.words.length > 0) return real;

  // Fallback: synthesize segments via the provider, then split into words.
  const segments = await getAIProvider().transcribe({ storageKey, durationSec, sizeBytes });
  const words: TranscriptWord[] = [];
  for (const seg of segments) {
    const toks = seg.text.split(/\s+/).filter(Boolean);
    if (toks.length === 0) continue;
    const span = Math.max(0.3, seg.end - seg.start);
    const per = span / toks.length;
    toks.forEach((tok, i) => {
      words.push({
        start: round(seg.start + i * per),
        end: round(seg.start + (i + 1) * per),
        word: tok,
      });
    });
  }
  return { segments, words };
}
