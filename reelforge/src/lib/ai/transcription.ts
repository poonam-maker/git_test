import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { getStorage } from "../storage";
import { runFfmpeg } from "../ffmpeg";
import type { TranscriptSegment, TranscriptWord } from "./types";
import { round } from "./heuristics";

// Speech-to-text via OpenAI Whisper. Anthropic has no audio model, so
// transcription is a separate provider from the language work Claude does.
//
// We request BOTH segment- and word-level timestamps. Word timings are what
// make precise editing possible: cutting individual filler words and tight
// silences, and word-by-word ("karaoke") animated captions.
//
// Audio is pre-extracted with ffmpeg first (mono 16kHz), which is what Whisper
// wants and collapses a big video under the hosted API's 25MB cap. Everything
// falls back gracefully so the pipeline never hard-fails.

const WHISPER_MAX_BYTES = 25 * 1024 * 1024;

export interface WhisperResult {
  segments: TranscriptSegment[];
  words: TranscriptWord[];
}

async function runWhisper(
  storageKey: string,
  sizeBytes: number
): Promise<WhisperResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prepared = await prepareAudio(storageKey, sizeBytes);
  if (!prepared) return null;

  try {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(prepared.bytes)]), prepared.filename);
    form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "segment");
    form.append("timestamp_granularities[]", "word");

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
      words?: { word: string; start: number; end: number }[];
      text?: string;
    };

    const segments: TranscriptSegment[] = (data.segments ?? []).map((s) => ({
      start: round(s.start),
      end: round(s.end),
      text: s.text.trim(),
    }));
    const words: TranscriptWord[] = (data.words ?? []).map((w) => ({
      start: round(w.start),
      end: round(w.end),
      word: w.word.trim(),
    }));

    if (segments.length === 0 && data.text) {
      segments.push({ start: 0, end: 0, text: data.text.trim() });
    }
    if (segments.length === 0) return null;
    return { segments, words };
  } catch (err) {
    console.warn("[transcription] Whisper request failed; falling back.", err);
    return null;
  }
}

/** Segment-only transcript (used by the AIProvider interface). */
export async function transcribeWithWhisper(
  storageKey: string,
  sizeBytes: number
): Promise<TranscriptSegment[] | null> {
  const r = await runWhisper(storageKey, sizeBytes);
  return r ? r.segments : null;
}

/** Full transcript with word timings (used by the editor). */
export async function transcribeWithWords(
  storageKey: string,
  sizeBytes: number
): Promise<WhisperResult | null> {
  return runWhisper(storageKey, sizeBytes);
}

/** Bytes to send to Whisper: compressed audio if ffmpeg is available, else raw. */
async function prepareAudio(
  storageKey: string,
  sizeBytes: number
): Promise<{ bytes: Buffer; filename: string } | null> {
  const storage = getStorage();
  const source = await storage.get(storageKey);

  const audio = await extractAudio(source, storageKey);
  if (audio) {
    if (audio.length <= WHISPER_MAX_BYTES) return { bytes: audio, filename: "audio.mp3" };
    console.warn("[transcription] Extracted audio still exceeds 25MB — chunk it. Falling back.");
    return null;
  }
  if ((sizeBytes || source.length) > WHISPER_MAX_BYTES) {
    console.warn("[transcription] File exceeds 25MB and ffmpeg is unavailable. Falling back.");
    return null;
  }
  return { bytes: source, filename: storageKey.split("/").pop() || "audio.mp4" };
}

async function extractAudio(source: Buffer, storageKey: string): Promise<Buffer | null> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "reelforge-audio-"));
  const inExt = path.extname(storageKey) || ".mp4";
  const inputPath = path.join(tmpDir, `in${inExt}`);
  const outputPath = path.join(tmpDir, "out.mp3");
  try {
    await fs.writeFile(inputPath, source);
    await runFfmpeg(["-y", "-i", inputPath, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "64k", outputPath]);
    return await fs.readFile(outputPath);
  } catch (err) {
    console.warn(
      "[transcription] audio extraction unavailable; using raw file if small enough.",
      err instanceof Error ? err.message : err
    );
    return null;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
