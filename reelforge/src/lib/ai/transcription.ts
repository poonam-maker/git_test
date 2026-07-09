import { getStorage } from "../storage";
import type { TranscriptSegment } from "./types";
import { round } from "./heuristics";

// Speech-to-text via OpenAI Whisper. Anthropic has no audio model, so
// transcription is a separate provider from the language/reasoning work Claude
// does. Kept behind this one function so it can be swapped for Deepgram,
// AssemblyAI, self-hosted Whisper, etc. without touching the pipeline.
//
// Returns null when transcription can't run (no key, file too large, API
// error), letting the caller fall back to a heuristic transcript so the
// pipeline never hard-fails.

// Whisper's hosted API caps uploads at 25 MB.
const WHISPER_MAX_BYTES = 25 * 1024 * 1024;

export async function transcribeWithWhisper(
  storageKey: string,
  sizeBytes: number
): Promise<TranscriptSegment[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[transcription] OPENAI_API_KEY not set — falling back to heuristic transcript.");
    return null;
  }
  if (sizeBytes > WHISPER_MAX_BYTES) {
    console.warn(
      "[transcription] File exceeds Whisper's 25MB limit; extract/compress audio first. Falling back."
    );
    return null;
  }

  try {
    const storage = getStorage();
    const bytes = await storage.get(storageKey);
    const filename = storageKey.split("/").pop() || "audio.mp4";

    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(bytes)]), filename);
    form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "segment");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      console.warn(`[transcription] Whisper API error ${res.status}; falling back.`);
      return null;
    }

    const data = (await res.json()) as {
      segments?: { start: number; end: number; text: string }[];
      text?: string;
    };

    if (data.segments && data.segments.length > 0) {
      return data.segments.map((s) => ({
        start: round(s.start),
        end: round(s.end),
        text: s.text.trim(),
      }));
    }
    // No segment timestamps returned — degrade to one block.
    if (data.text) {
      return [{ start: 0, end: 0, text: data.text.trim() }];
    }
    return null;
  } catch (err) {
    console.warn("[transcription] Whisper request failed; falling back.", err);
    return null;
  }
}
