import type {
  AIProvider,
  CaptionLine,
  ClipSuggestion,
  CopyContext,
  SilenceGap,
  SocialCopy,
  TranscriptSegment,
} from "./types";
import {
  detectSilenceGaps,
  heuristicClips,
  heuristicSocialCopy,
  round,
  sliceCaptions,
  hashString,
} from "./heuristics";

// Deterministic, offline mock. It fabricates a plausible transcript and then
// runs the shared heuristics over it, so the entire product workflow is
// demoable with zero API keys or GPUs.

const SAMPLE_SENTENCES = [
  "Here's the one thing nobody tells you about growing on social media.",
  "Most people quit right before it actually starts to work.",
  "Let me show you the exact system we use every single week.",
  "The biggest mistake is trying to be perfect instead of consistent.",
  "This tiny change doubled our reach in under a month.",
  "If you only remember one thing from this video, make it this.",
  "Repurposing is how one recording becomes a whole week of content.",
  "Your audience wants value first, and the sale comes second.",
  "Save this so you can come back to it when you need it.",
  "That's exactly why we built this workflow the way we did.",
  "Small businesses win by showing up, not by going viral once.",
  "Batch your content and your future self will thank you.",
];

export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async transcribe({
    storageKey,
    durationSec,
  }: {
    storageKey: string;
    durationSec: number;
  }): Promise<TranscriptSegment[]> {
    const seed = hashString(storageKey);
    const segments: TranscriptSegment[] = [];
    let t = 0;
    let i = 0;
    while (t < durationSec) {
      const len = 3 + ((seed + i) % 4); // 3-6s per segment
      const end = Math.min(t + len, durationSec);
      segments.push({
        start: round(t),
        end: round(end),
        text: SAMPLE_SENTENCES[(seed + i) % SAMPLE_SENTENCES.length],
      });
      t = end + (i % 3 === 0 ? 0.8 : 0); // occasional pause -> silence gap
      i++;
    }
    return segments;
  }

  async detectSilence(transcript: TranscriptSegment[]): Promise<SilenceGap[]> {
    return detectSilenceGaps(transcript);
  }

  async suggestClips({
    transcript,
    durationSec,
    targetClipSeconds,
  }: {
    transcript: TranscriptSegment[];
    durationSec: number;
    targetClipSeconds: number;
  }): Promise<ClipSuggestion[]> {
    return heuristicClips(transcript, durationSec, targetClipSeconds);
  }

  async generateCaptions({
    transcript,
    startSec,
    endSec,
  }: {
    transcript: TranscriptSegment[];
    startSec: number;
    endSec: number;
  }): Promise<CaptionLine[]> {
    return sliceCaptions(transcript, startSec, endSec);
  }

  async generateSocialCopy(ctx: CopyContext): Promise<SocialCopy> {
    return heuristicSocialCopy(ctx);
  }
}
