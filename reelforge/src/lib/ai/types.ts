// Provider-agnostic AI contract. Swap `mock` for `openai` (or Whisper, Deepgram,
// Anthropic, etc.) by implementing this interface — nothing else changes.

export interface TranscriptSegment {
  start: number; // seconds
  end: number;
  text: string;
}

export interface SilenceGap {
  start: number;
  end: number;
}

export interface ClipSuggestion {
  title: string;
  startSec: number;
  endSec: number;
  score: number; // 0..1 relevance / virality hint
}

export interface CaptionLine {
  startSec: number;
  endSec: number;
  text: string;
}

export interface SocialCopy {
  title: string;
  hook: string;
  description: string;
  hashtags: string[];
  cta: string;
}

export interface CopyContext {
  clipTitle: string;
  transcriptText: string;
  brand?: {
    name?: string;
    tone?: string;
    ctaTemplates?: string[];
  };
  templateTone?: string;
}

export interface AIProvider {
  readonly name: string;
  transcribe(input: {
    storageKey: string;
    durationSec: number;
  }): Promise<TranscriptSegment[]>;
  detectSilence(transcript: TranscriptSegment[]): Promise<SilenceGap[]>;
  suggestClips(input: {
    transcript: TranscriptSegment[];
    durationSec: number;
    targetClipSeconds: number;
  }): Promise<ClipSuggestion[]>;
  generateCaptions(input: {
    transcript: TranscriptSegment[];
    startSec: number;
    endSec: number;
  }): Promise<CaptionLine[]>;
  generateSocialCopy(ctx: CopyContext): Promise<SocialCopy>;
}
