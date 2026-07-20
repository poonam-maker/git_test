import type { TranscriptSegment, TranscriptWord } from "../ai/types";

// The core edit: given word-level timestamps, decide what to keep and what to
// cut (filler words + long silences), then remap the transcript onto the
// shortened timeline so captions and clips stay aligned to the edited master.
//
// This is deterministic and offline — the "intelligence" is the word timings
// (from Whisper) plus a filler lexicon. No model call needed for the cut itself.

// Common English fillers / crutch words. Matched on the cleaned word token.
const FILLERS = new Set([
  "um",
  "uh",
  "uhh",
  "umm",
  "erm",
  "er",
  "hmm",
  "mm",
  "ah",
  "eh",
  "like", // only when isolated (see isFiller) — kept conservative
  "basically",
  "literally",
  "actually",
  "honestly",
]);

// Words we only treat as filler when they're truly standalone crutches are
// risky to auto-remove, so keep the aggressive list to clear disfluencies.
const SAFE_FILLERS = new Set(["um", "uh", "uhh", "umm", "erm", "er", "hmm", "mm", "ah", "eh"]);

export interface EditRange {
  start: number;
  end: number;
}

export interface RemovedRange {
  start: number;
  end: number;
  type: "filler" | "silence";
}

export interface EditPlan {
  keep: EditRange[]; // ranges to keep, in ORIGINAL time
  removed: RemovedRange[]; // ranges cut out, in ORIGINAL time
  editedSec: number;
  removedFillerCount: number;
  removedSilenceCount: number;
}

export interface AutoCutOptions {
  /** Silences longer than this (seconds) get cut. */
  maxPause?: number;
  /** Keep a little air around kept speech so consonants aren't clipped. */
  pad?: number;
  /** Don't bother cutting gaps shorter than this — avoids choppy micro-cuts. */
  minCut?: number;
  /** 0..1 — higher removes more aggressively (from the template). */
  aggressiveness?: number;
  /** Remove filler words too. */
  removeFillers?: boolean;
}

function clean(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, "");
}

function isFiller(word: string, aggressive: boolean): boolean {
  const w = clean(word);
  if (!w) return false;
  if (SAFE_FILLERS.has(w)) return true;
  return aggressive && FILLERS.has(w);
}

/**
 * Build the edit plan from word timings.
 * A "keep block" grows word-by-word as long as the pause between kept words
 * stays under maxPause; filler words are excluded, so the silence around them
 * collapses into a cut.
 */
export function planEdit(
  words: TranscriptWord[],
  durationSec: number,
  opts: AutoCutOptions = {}
): EditPlan {
  const aggr = opts.aggressiveness ?? 0.7;
  const maxPause = opts.maxPause ?? Math.max(0.18, 0.55 - aggr * 0.35);
  const pad = opts.pad ?? 0.04;
  const minCut = opts.minCut ?? 0.18;
  const removeFillers = opts.removeFillers ?? true;

  if (words.length === 0) {
    return { keep: [{ start: 0, end: durationSec }], removed: [], editedSec: durationSec, removedFillerCount: 0, removedSilenceCount: 0 };
  }

  // 1. Split into keep blocks over the kept (non-filler) words.
  const kept = words.filter((w) => !(removeFillers && isFiller(w.word, aggr > 0.5)));
  const removedFillerCount = words.length - kept.length;

  const blocks: EditRange[] = [];
  let cur: EditRange | null = null;
  for (const w of kept) {
    if (!cur) {
      cur = { start: w.start, end: w.end };
      continue;
    }
    const gap = w.start - cur.end;
    if (gap <= maxPause) {
      cur.end = w.end; // stay in the same block (natural pause)
    } else {
      blocks.push(cur);
      cur = { start: w.start, end: w.end };
    }
  }
  if (cur) blocks.push(cur);

  // 2. Pad blocks and clamp to [0, duration].
  let padded = blocks.map((b) => ({
    start: Math.max(0, b.start - pad),
    end: Math.min(durationSec, b.end + pad),
  }));

  // 3. Merge blocks whose gap is smaller than minCut (not worth a cut).
  const merged: EditRange[] = [];
  for (const b of padded) {
    const last = merged[merged.length - 1];
    if (last && b.start - last.end < minCut) last.end = Math.max(last.end, b.end);
    else merged.push({ ...b });
  }
  padded = merged;

  // 4. Compute removed ranges (complement of keep within the video).
  const removed: RemovedRange[] = [];
  let cursor = 0;
  const fillerRanges = words.filter((w) => removeFillers && isFiller(w.word, aggr > 0.5));
  const overlapsFiller = (s: number, e: number) =>
    fillerRanges.some((f) => f.end > s && f.start < e);

  for (const b of padded) {
    if (b.start - cursor >= minCut) {
      const s = cursor;
      const e = b.start;
      removed.push({ start: round(s), end: round(e), type: overlapsFiller(s, e) ? "filler" : "silence" });
    }
    cursor = Math.max(cursor, b.end);
  }
  if (durationSec - cursor >= minCut) {
    removed.push({ start: round(cursor), end: round(durationSec), type: "silence" });
  }

  const editedSec = padded.reduce((sum, b) => sum + (b.end - b.start), 0);
  const removedSilenceCount = removed.filter((r) => r.type === "silence").length;

  return {
    keep: padded.map((b) => ({ start: round(b.start), end: round(b.end) })),
    removed,
    editedSec: round(editedSec),
    removedFillerCount,
    removedSilenceCount,
  };
}

/** Map a point on the ORIGINAL timeline to the EDITED timeline (or null if cut). */
function makeMapper(keep: EditRange[]) {
  const offsets: number[] = [];
  let acc = 0;
  for (const b of keep) {
    offsets.push(acc);
    acc += b.end - b.start;
  }
  return (t: number): number | null => {
    for (let i = 0; i < keep.length; i++) {
      const b = keep[i];
      if (t >= b.start && t <= b.end) return round(offsets[i] + (t - b.start));
    }
    return null;
  };
}

/** Remap words to the edited timeline, dropping any that fall inside a cut. */
export function remapWords(words: TranscriptWord[], keep: EditRange[]): TranscriptWord[] {
  const map = makeMapper(keep);
  const out: TranscriptWord[] = [];
  for (const w of words) {
    const s = map(clampToKeep(w.start, keep));
    const e = map(clampToKeep(w.end, keep));
    if (s === null || e === null || e <= s) continue;
    out.push({ start: s, end: e, word: w.word });
  }
  return out;
}

/**
 * Rebuild caption-friendly segments on the edited timeline by regrouping the
 * kept words into short lines (~6 words / ~2.4s), which reads well on-screen.
 */
export function buildEditedSegments(editedWords: TranscriptWord[]): TranscriptSegment[] {
  const segs: TranscriptSegment[] = [];
  let line: TranscriptWord[] = [];
  const flush = () => {
    if (line.length === 0) return;
    segs.push({
      start: line[0].start,
      end: line[line.length - 1].end,
      text: line.map((w) => w.word).join(" ").replace(/\s+([,.!?])/g, "$1"),
    });
    line = [];
  };
  for (const w of editedWords) {
    line.push(w);
    const span = line[line.length - 1].end - line[0].start;
    if (line.length >= 6 || span >= 2.4 || /[.!?]$/.test(w.word)) flush();
  }
  flush();
  return segs;
}

function clampToKeep(t: number, keep: EditRange[]): number {
  // Nudge a boundary that sits exactly on a cut edge back into the kept range.
  for (const b of keep) {
    if (t >= b.start && t <= b.end) return t;
  }
  // find nearest kept range edge
  let best = t;
  let bestD = Infinity;
  for (const b of keep) {
    for (const edge of [b.start, b.end]) {
      const d = Math.abs(edge - t);
      if (d < bestD) { bestD = d; best = edge; }
    }
  }
  return best;
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
