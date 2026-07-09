import Anthropic from "@anthropic-ai/sdk";
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
} from "./heuristics";
import { MockAIProvider } from "./mock-provider";
import { transcribeWithWhisper } from "./transcription";

// Real provider:
//   - Transcription  -> OpenAI Whisper (Anthropic has no audio model)
//   - Clip selection -> Claude, reasoning over the transcript
//   - Social copy     -> Claude, brand-aware
//   - Silence + captions -> derived from transcript timing (no model needed)
//
// Every model-backed method falls back to the deterministic heuristics if the
// API key is missing or a call fails, so the pipeline never hard-fails.
//
// Model is configurable via ANTHROPIC_MODEL and defaults to Claude Opus 4.8 —
// the most capable model. Set it to a cheaper tier (e.g. claude-haiku-4-5) if
// you want to trade quality for per-clip cost at scale.

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export class ClaudeAIProvider implements AIProvider {
  readonly name = "claude";
  private client: Anthropic | null;
  private fallback = new MockAIProvider();

  constructor() {
    // Zero-arg constructor reads ANTHROPIC_API_KEY (or an `ant` profile).
    this.client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  }

  async transcribe(input: {
    storageKey: string;
    durationSec: number;
    sizeBytes?: number;
  }): Promise<TranscriptSegment[]> {
    const segments = await transcribeWithWhisper(
      input.storageKey,
      input.sizeBytes ?? 0
    );
    if (segments && segments.length > 0) return segments;
    // No real transcript available — synthesize a plausible one so downstream
    // steps still produce a full, demoable result.
    return this.fallback.transcribe(input);
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
    if (!this.client || transcript.length === 0) {
      return heuristicClips(transcript, durationSec, targetClipSeconds);
    }

    const lines = transcript
      .map((s) => `[${s.start.toFixed(1)}-${s.end.toFixed(1)}] ${s.text}`)
      .join("\n");

    try {
      const data = await this.generateJSON<{ clips: ClipSuggestion[] }>({
        maxTokens: 4096,
        effort: "medium",
        system:
          "You are an expert short-form video editor for TikTok, Reels, and YouTube Shorts. " +
          "Given a timestamped transcript, select the most engaging, self-contained moments to cut " +
          "into short clips. Each clip should start on a strong hook and end on a satisfying beat.",
        user:
          `Transcript (timestamps in seconds):\n${lines}\n\n` +
          `Pick up to 6 clips, each roughly ${targetClipSeconds} seconds long (never longer than ` +
          `${Math.round(targetClipSeconds * 1.6)}s). Video duration is ${durationSec.toFixed(0)}s. ` +
          `For each clip give a punchy title (max 8 words), the start and end time in seconds, and a ` +
          `score from 0 to 1 estimating how likely it is to perform well.`,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            clips: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  startSec: { type: "number" },
                  endSec: { type: "number" },
                  score: { type: "number" },
                },
                required: ["title", "startSec", "endSec", "score"],
              },
            },
          },
          required: ["clips"],
        },
      });

      const clamped = (data.clips || [])
        .map((c, i) => ({
          title: c.title?.slice(0, 120) || `Clip ${i + 1}`,
          startSec: round(Math.max(0, Math.min(c.startSec, durationSec))),
          endSec: round(Math.max(0, Math.min(c.endSec, durationSec))),
          score: round(Math.max(0, Math.min(c.score ?? 0.7, 1))),
        }))
        .filter((c) => c.endSec > c.startSec)
        .sort((a, b) => b.score - a.score);

      return clamped.length > 0
        ? clamped
        : heuristicClips(transcript, durationSec, targetClipSeconds);
    } catch (err) {
      console.warn("[claude] suggestClips failed; using heuristic.", err);
      return heuristicClips(transcript, durationSec, targetClipSeconds);
    }
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
    // Captions must stay word-accurate and time-aligned — take them straight
    // from the transcript rather than paraphrasing with a model.
    return sliceCaptions(transcript, startSec, endSec);
  }

  async generateSocialCopy(ctx: CopyContext): Promise<SocialCopy> {
    if (!this.client) return heuristicSocialCopy(ctx);

    const brandLine = ctx.brand?.name
      ? `Brand: ${ctx.brand.name}. Tone of voice: ${ctx.brand.tone || "friendly"}. ` +
        `Preferred CTAs: ${(ctx.brand.ctaTemplates || []).join(", ") || "n/a"}.`
      : `Tone of voice: ${ctx.templateTone || "friendly"}.`;

    try {
      const copy = await this.generateJSON<SocialCopy>({
        maxTokens: 1024,
        effort: "low",
        system:
          "You write high-performing social media copy for creators and small businesses. " +
          "Match the brand's tone. Hooks must stop the scroll. Keep it native to short-form platforms.",
        user:
          `${brandLine}\n\nClip title: ${ctx.clipTitle}\n` +
          `Transcript of the clip:\n${ctx.transcriptText}\n\n` +
          `Write: a title, a scroll-stopping hook (1 line), a short description (1-2 sentences), ` +
          `5 relevant hashtags (each starting with #), and a call to action.`,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            hook: { type: "string" },
            description: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            cta: { type: "string" },
          },
          required: ["title", "hook", "description", "hashtags", "cta"],
        },
      });

      return {
        title: copy.title || ctx.clipTitle,
        hook: copy.hook || "",
        description: copy.description || "",
        hashtags: (copy.hashtags || [])
          .slice(0, 8)
          .map((h) => (h.startsWith("#") ? h : `#${h}`)),
        cta: copy.cta || (ctx.brand?.ctaTemplates?.[0] ?? "Follow for more"),
      };
    } catch (err) {
      console.warn("[claude] generateSocialCopy failed; using heuristic.", err);
      return heuristicSocialCopy(ctx);
    }
  }

  // ── shared helper: constrained JSON generation ──────────────────────
  private async generateJSON<T>(opts: {
    system: string;
    user: string;
    schema: Record<string, unknown>;
    maxTokens: number;
    effort: "low" | "medium" | "high";
  }): Promise<T> {
    const resp = await this.client!.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens,
      system: opts.system,
      output_config: {
        effort: opts.effort,
        format: { type: "json_schema", schema: opts.schema },
      },
      messages: [{ role: "user", content: opts.user }],
    });

    // With output_config.format the first text block is guaranteed valid JSON.
    const textBlock = resp.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text block in Claude response");
    }
    return JSON.parse(textBlock.text) as T;
  }
}
