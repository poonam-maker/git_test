import type {
  AIProvider,
  CaptionLine,
  ClipSuggestion,
  CopyContext,
  SilenceGap,
  SocialCopy,
  TranscriptSegment,
} from "./types";

// Deterministic, offline mock. It produces plausible, structured output so the
// entire product workflow is demoable with zero API keys or GPUs. Every method
// mirrors the real provider signature, so swapping in OpenAI/Whisper later is a
// drop-in change.

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

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

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

  async detectSilence(
    transcript: TranscriptSegment[]
  ): Promise<SilenceGap[]> {
    const gaps: SilenceGap[] = [];
    for (let i = 1; i < transcript.length; i++) {
      const gap = transcript[i].start - transcript[i - 1].end;
      if (gap >= 0.6) {
        gaps.push({
          start: round(transcript[i - 1].end),
          end: round(transcript[i].start),
        });
      }
    }
    return gaps;
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
    if (transcript.length === 0) return [];
    const clips: ClipSuggestion[] = [];
    let idx = 0;
    let clipNo = 1;
    while (idx < transcript.length) {
      const start = transcript[idx].start;
      let end = start;
      let j = idx;
      while (j < transcript.length && end - start < targetClipSeconds) {
        end = transcript[j].end;
        j++;
      }
      const text = transcript
        .slice(idx, j)
        .map((s) => s.text)
        .join(" ");
      clips.push({
        title: deriveTitle(text, clipNo),
        startSec: round(start),
        endSec: round(Math.min(end, durationSec)),
        // Score peaks in the middle of the video, where hooks tend to land.
        score: round(0.6 + 0.35 * Math.sin((clipNo / 4) * Math.PI)),
      });
      idx = j;
      clipNo++;
      if (clipNo > 8) break; // cap suggestions for a clean UI
    }
    return clips.sort((a, b) => b.score - a.score);
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
    return transcript
      .filter((s) => s.end > startSec && s.start < endSec)
      .map((s) => ({
        startSec: round(Math.max(s.start, startSec)),
        endSec: round(Math.min(s.end, endSec)),
        text: s.text,
      }));
  }

  async generateSocialCopy(ctx: CopyContext): Promise<SocialCopy> {
    const brandName = ctx.brand?.name?.trim();
    const tone = ctx.brand?.tone || ctx.templateTone || "friendly";
    const seed = hashString(ctx.clipTitle + ctx.transcriptText);
    const hooks = [
      "Stop scrolling — you need to hear this 👇",
      "The mistake costing you followers every week:",
      "Nobody talks about this, but it changes everything:",
      "Here's how to turn 1 video into a week of content:",
      "If you're a creator or small business, watch this:",
    ];
    const hashtagPool = [
      "#contentcreator",
      "#smallbusiness",
      "#socialmediatips",
      "#reels",
      "#tiktoktips",
      "#marketing",
      "#creatoreconomy",
      "#shorts",
      "#growthtips",
      "#repurposing",
    ];
    const ctaOptions =
      ctx.brand?.ctaTemplates && ctx.brand.ctaTemplates.length > 0
        ? ctx.brand.ctaTemplates
        : ["Follow for more", "Save this for later", "Link in bio"];

    const hook = hooks[seed % hooks.length];
    const cta = ctaOptions[seed % ctaOptions.length];
    const hashtags = pickN(hashtagPool, 5, seed);
    const signature = brandName ? ` — from ${brandName}` : "";

    return {
      title: ctx.clipTitle,
      hook,
      description: `${firstSentence(ctx.transcriptText)} ${cta}.${signature} (${tone} tone)`,
      hashtags,
      cta,
    };
  }
}

// ── helpers ──────────────────────────────────────────────────────────
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function deriveTitle(text: string, n: number): string {
  const words = text.split(/\s+/).slice(0, 7).join(" ").replace(/[.,!?]$/, "");
  return words ? `${words}…` : `Clip ${n}`;
}

function firstSentence(text: string): string {
  const match = text.match(/[^.!?]+[.!?]/);
  return (match ? match[0] : text).trim();
}

function pickN<T>(arr: T[], n: number, seed: number): T[] {
  const out: T[] = [];
  const used = new Set<number>();
  let i = 0;
  while (out.length < Math.min(n, arr.length)) {
    const idx = (seed + i * 7) % arr.length;
    if (!used.has(idx)) {
      used.add(idx);
      out.push(arr[idx]);
    }
    i++;
  }
  return out;
}
