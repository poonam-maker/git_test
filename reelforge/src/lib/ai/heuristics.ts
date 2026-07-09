import type {
  CaptionLine,
  ClipSuggestion,
  CopyContext,
  SilenceGap,
  SocialCopy,
  TranscriptSegment,
} from "./types";

// Deterministic, offline building blocks shared by the mock provider and used
// as graceful fallbacks by the real (Claude) provider when the API is
// unavailable or a call fails. Keeping these pure and shared means the product
// always produces *something* usable, and the two providers never drift.

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function deriveTitle(text: string, n: number): string {
  const words = text.split(/\s+/).slice(0, 7).join(" ").replace(/[.,!?]$/, "");
  return words ? `${words}…` : `Clip ${n}`;
}

export function firstSentence(text: string): string {
  const match = text.match(/[^.!?]+[.!?]/);
  return (match ? match[0] : text).trim();
}

export function pickN<T>(arr: T[], n: number, seed: number): T[] {
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

/** Silence/filler gaps = pauses between transcript segments. No model needed. */
export function detectSilenceGaps(transcript: TranscriptSegment[]): SilenceGap[] {
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

/** Chunk the transcript into clips of ~targetClipSeconds. */
export function heuristicClips(
  transcript: TranscriptSegment[],
  durationSec: number,
  targetClipSeconds: number
): ClipSuggestion[] {
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
      score: round(0.6 + 0.35 * Math.sin((clipNo / 4) * Math.PI)),
    });
    idx = j;
    clipNo++;
    if (clipNo > 8) break;
  }
  return clips.sort((a, b) => b.score - a.score);
}

/** Captions come straight from transcript timing within the clip window. */
export function sliceCaptions(
  transcript: TranscriptSegment[],
  startSec: number,
  endSec: number
): CaptionLine[] {
  return transcript
    .filter((s) => s.end > startSec && s.start < endSec)
    .map((s) => ({
      startSec: round(Math.max(s.start, startSec)),
      endSec: round(Math.min(s.end, endSec)),
      text: s.text,
    }));
}

const HOOK_POOL = [
  "Stop scrolling — you need to hear this 👇",
  "The mistake costing you followers every week:",
  "Nobody talks about this, but it changes everything:",
  "Here's how to turn 1 video into a week of content:",
  "If you're a creator or small business, watch this:",
];

const HASHTAG_POOL = [
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

/** Brand-aware social copy without any model call. */
export function heuristicSocialCopy(ctx: CopyContext): SocialCopy {
  const brandName = ctx.brand?.name?.trim();
  const tone = ctx.brand?.tone || ctx.templateTone || "friendly";
  const seed = hashString(ctx.clipTitle + ctx.transcriptText);
  const ctaOptions =
    ctx.brand?.ctaTemplates && ctx.brand.ctaTemplates.length > 0
      ? ctx.brand.ctaTemplates
      : ["Follow for more", "Save this for later", "Link in bio"];
  const hook = HOOK_POOL[seed % HOOK_POOL.length];
  const cta = ctaOptions[seed % ctaOptions.length];
  const signature = brandName ? ` — from ${brandName}` : "";
  return {
    title: ctx.clipTitle,
    hook,
    description: `${firstSentence(ctx.transcriptText)} ${cta}.${signature} (${tone} tone)`,
    hashtags: pickN(HASHTAG_POOL, 5, seed),
    cta,
  };
}

export function transcriptTextFor(
  transcript: TranscriptSegment[],
  startSec: number,
  endSec: number
): string {
  return transcript
    .filter((s) => s.end > startSec && s.start < endSec)
    .map((s) => s.text)
    .join(" ");
}
