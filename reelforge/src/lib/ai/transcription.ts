import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { getStorage } from "../storage";
import { runFfmpeg } from "../ffmpeg";
import type { TranscriptSegment } from "./types";
import { round } from "./heuristics";

// Speech-to-text via OpenAI Whisper. Anthropic has no audio model, so
// transcription is a separate provider from the language/reasoning work Claude
// does. Kept behind this one function so it can be swapped for Deepgram,
// AssemblyAI, self-hosted Whisper, etc. without touching the pipeline.
//
// Before hitting Whisper we extract a compact mono 16kHz audio track with
// ffmpeg. That's what Whisper wants anyway, and it collapses a multi-hundred-MB
// video down to ~0.5 MB/min — so the hosted API's 25MB cap covers ~50 minutes
// of video instead of ~2 minutes of raw upload.
//
// Returns null when transcription can't run (no key, still too large, API
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

  const prepared = await prepareAudio(storageKey, sizeBytes);
  if (!prepared) return null;

  try {
    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array(prepared.bytes)]),
      prepared.filename
    );
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
    if (data.text) {
      return [{ start: 0, end: 0, text: data.text.trim() }];
    }
    return null;
  } catch (err) {
    console.warn("[transcription] Whisper request failed; falling back.", err);
    return null;
  }
}

/**
 * Produce the bytes to send to Whisper: a compressed audio track when ffmpeg is
 * available, otherwise the raw file (only if it's already under the limit).
 */
async function prepareAudio(
  storageKey: string,
  sizeBytes: number
): Promise<{ bytes: Buffer; filename: string } | null> {
  const storage = getStorage();
  const source = await storage.get(storageKey);

  const audio = await extractAudio(source, storageKey);
  if (audio) {
    if (audio.length <= WHISPER_MAX_BYTES) {
      return { bytes: audio, filename: "audio.mp3" };
    }
    console.warn(
      "[transcription] Extracted audio still exceeds 25MB (very long video) — chunk it. Falling back."
    );
    return null;
  }

  // No ffmpeg — send the raw file only if it already fits.
  if ((sizeBytes || source.length) > WHISPER_MAX_BYTES) {
    console.warn(
      "[transcription] File exceeds 25MB and ffmpeg is unavailable to extract audio. Falling back."
    );
    return null;
  }
  const filename = storageKey.split("/").pop() || "audio.mp4";
  return { bytes: source, filename };
}

/** Extract mono 16kHz MP3 audio via ffmpeg. Returns null if ffmpeg is missing. */
async function extractAudio(
  source: Buffer,
  storageKey: string
): Promise<Buffer | null> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "reelforge-audio-"));
  const inExt = path.extname(storageKey) || ".mp4";
  const inputPath = path.join(tmpDir, `in${inExt}`);
  const outputPath = path.join(tmpDir, "out.mp3");
  try {
    await fs.writeFile(inputPath, source);
    await runFfmpeg([
      "-y",
      "-i", inputPath,
      "-vn", // drop video
      "-ac", "1", // mono
      "-ar", "16000", // 16kHz (Whisper's native rate)
      "-b:a", "64k",
      outputPath,
    ]);
    return await fs.readFile(outputPath);
  } catch (err) {
    // ffmpeg not installed or failed — signal fallback to raw-file path.
    console.warn("[transcription] audio extraction unavailable; using raw file if small enough.", err instanceof Error ? err.message : err);
    return null;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
