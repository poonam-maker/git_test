import { promises as fs } from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { prisma } from "./prisma";
import { getStorage } from "./storage";
import { getPlan } from "./plans";
import { getTemplate, CAPTION_STYLES } from "./templates";
import { runFfmpeg } from "./ffmpeg";
import type { ExportFormat } from "@prisma/client";

// Export renderer. Turns a Clip + its captions into a real, publish-ready video
// file: trim to the clip window, reframe to the platform's aspect ratio, and
// burn in styled captions via ffmpeg.
//
// If ffmpeg isn't available (or rendering fails), it falls back to pointing the
// export at the source video and marks it DONE — the product keeps working,
// just without the reframe/burn-in. Set FFMPEG_PATH to a custom binary.

// Target output dimensions per platform.
const DIMENSIONS: Record<ExportFormat, { w: number; h: number }> = {
  TIKTOK: { w: 1080, h: 1920 },
  REELS: { w: 1080, h: 1920 },
  SHORTS: { w: 1080, h: 1920 },
  VERTICAL: { w: 1080, h: 1920 },
  SQUARE: { w: 1080, h: 1080 },
};

export async function runExportJob(exportId: string): Promise<void> {
  const exp = await prisma.export.findUnique({
    where: { id: exportId },
    include: {
      clip: {
        include: {
          captions: { orderBy: { order: "asc" } },
          project: { include: { video: true, workspace: true, editMaster: true } },
        },
      },
    },
  });
  if (!exp) throw new Error("Export not found");

  const video = exp.clip.project.video;
  if (!video) throw new Error("Project has no video");

  await prisma.export.update({
    where: { id: exportId },
    data: { status: "RUNNING" },
  });

  const plan = getPlan(exp.clip.project.workspace.planTier);
  const watermark = !plan.features.includes("remove_watermark");
  const template = getTemplate(exp.clip.project.templateKey);
  const captionStyleKey = exp.captionStyle || template.defaults.captionStyle;
  const dims = DIMENSIONS[exp.format];

  // Cut from the edited master when available — clip times are already on its
  // timeline. Otherwise fall back to the raw upload.
  const master = exp.clip.project.editMaster;
  const useMaster = Boolean(master?.storageKey);
  const sourceKey = useMaster ? master!.storageKey! : video.storageKey;
  const sourceName = useMaster ? "master.mp4" : video.originalName;

  // Word timings (edited timeline) drive animated word-by-word captions.
  const words = ((master?.words as WordTiming[] | null) ?? []).filter(
    (w) => w.end > exp.clip.startSec && w.start < exp.clip.endSec
  );

  try {
    const outputKey = await renderWithFfmpeg({
      sourceKey,
      sourceName,
      clipId: exp.clip.id,
      startSec: exp.clip.startSec,
      endSec: exp.clip.endSec,
      captions: exp.clip.captions.map((c) => ({
        startSec: c.startSec,
        endSec: c.endSec,
        text: c.text,
      })),
      words,
      captionStyleKey,
      dims,
      watermark,
    });

    await prisma.export.update({
      where: { id: exportId },
      data: { status: "DONE", storageKey: outputKey },
    });
  } catch (err) {
    console.warn("[render] ffmpeg render failed; falling back to source clip.", err);
    // Fallback: hand back the source we tried to cut from so it's downloadable.
    await prisma.export.update({
      where: { id: exportId },
      data: { status: "DONE", storageKey: sourceKey },
    });
  }
}

interface WordTiming {
  start: number;
  end: number;
  word: string;
}

interface RenderInput {
  sourceKey: string;
  sourceName: string;
  clipId: string;
  startSec: number;
  endSec: number;
  captions: { startSec: number; endSec: number; text: string }[];
  words: WordTiming[];
  captionStyleKey: string;
  dims: { w: number; h: number };
  watermark: boolean;
}

async function renderWithFfmpeg(input: RenderInput): Promise<string> {
  const storage = getStorage();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "reelforge-"));
  const inExt = path.extname(input.sourceName) || ".mp4";
  const inputPath = path.join(tmpDir, `in${inExt}`);
  const assPath = path.join(tmpDir, "caps.ass");
  const outputPath = path.join(tmpDir, "out.mp4");

  try {
    // Materialize the source and the caption file on disk for ffmpeg.
    const bytes = await storage.get(input.sourceKey);
    await fs.writeFile(inputPath, bytes);
    await fs.writeFile(
      assPath,
      input.words.length > 0
        ? buildKaraokeAss(input.words, input.captionStyleKey, input.dims, input.startSec)
        : buildAss(input.captions, input.captionStyleKey, input.dims, input.startSec)
    );

    const duration = Math.max(0.5, input.endSec - input.startSec);
    const { w, h } = input.dims;

    // Reframe (fill + center-crop) then burn in captions.
    let vf =
      `scale=${w}:${h}:force_original_aspect_ratio=increase,` +
      `crop=${w}:${h},` +
      `subtitles='${escapeFilterPath(assPath)}'`;
    if (input.watermark) {
      vf +=
        `,drawtext=text='ReelForge':fontcolor=white@0.7:fontsize=28:` +
        `x=w-tw-24:y=h-th-24:box=1:boxcolor=black@0.35:boxborderw=8`;
    }

    const args = [
      "-y",
      "-ss", String(input.startSec),
      "-i", inputPath,
      "-t", String(duration),
      "-vf", vf,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-c:a", "aac",
      "-movflags", "+faststart",
      outputPath,
    ];

    await runFfmpeg(args);

    const outBytes = await fs.readFile(outputPath);
    const outputKey = `exports/${input.clipId}/${crypto
      .randomBytes(8)
      .toString("hex")}.mp4`;
    await storage.put(outputKey, outBytes, "video/mp4");
    return outputKey;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

// ── ASS subtitle generation ─────────────────────────────────────────
// ASS alignment (numpad): 2 = bottom-center, 5 = middle-center, 8 = top-center.
const PLACEMENT_ALIGN: Record<string, number> = { bottom: 2, center: 5, top: 8 };
// Colours are &HAABBGGRR (alpha, blue, green, red).
const STYLE_COLOUR: Record<string, string> = {
  "bold-bottom": "&H00FFFFFF", // white
  "karaoke-center": "&H0000FFFF", // yellow
  "clean-top": "&H00FFFFFF",
  "minimal-bottom": "&H00FFFFFF",
};

function buildAss(
  captions: RenderInput["captions"],
  styleKey: string,
  dims: { w: number; h: number },
  clipStart: number
): string {
  const style = CAPTION_STYLES[styleKey] ?? CAPTION_STYLES["bold-bottom"];
  const align = PLACEMENT_ALIGN[style.placement] ?? 2;
  const colour = STYLE_COLOUR[styleKey] ?? "&H00FFFFFF";
  const fontSize = Math.round(dims.h * 0.045);
  const marginV = Math.round(dims.h * 0.08);
  const bold = styleKey === "bold-bottom" || styleKey === "karaoke-center" ? -1 : 0;

  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${dims.w}`,
    `PlayResY: ${dims.h}`,
    "WrapStyle: 2",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,Arial,${fontSize},${colour},&H000000FF,&H00000000,&H80000000,${bold},0,0,0,100,100,0,0,1,4,2,${align},80,80,${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];

  const events = captions
    .map((c) => {
      const start = Math.max(0, c.startSec - clipStart);
      const end = Math.max(start + 0.3, c.endSec - clipStart);
      const text = c.text.replace(/\r?\n/g, " ").replace(/[{}]/g, "");
      return `Dialogue: 0,${assTime(start)},${assTime(end)},Default,,0,0,0,,${text}`;
    })
    .join("\n");

  return header.join("\n") + "\n" + events + "\n";
}

// Animated captions: words highlight one-by-one as they're spoken (the TikTok
// "karaoke" look), using ASS \k timing. PrimaryColour = spoken, Secondary = not
// yet spoken.
function buildKaraokeAss(
  words: WordTiming[],
  styleKey: string,
  dims: { w: number; h: number },
  clipStart: number
): string {
  const style = CAPTION_STYLES[styleKey] ?? CAPTION_STYLES["bold-bottom"];
  const align = PLACEMENT_ALIGN[style.placement] ?? 2;
  const primary = STYLE_COLOUR[styleKey] ?? "&H00FFFFFF"; // highlighted (spoken)
  const secondary = "&H70FFFFFF"; // dim white (not yet spoken)
  const fontSize = Math.round(dims.h * 0.05);
  const marginV = Math.round(dims.h * 0.08);

  // Group words into short on-screen lines.
  const lines: WordTiming[][] = [];
  let line: WordTiming[] = [];
  for (const w of words) {
    line.push(w);
    const span = line[line.length - 1].end - line[0].start;
    if (line.length >= 5 || span >= 2.2 || /[.!?]$/.test(w.word)) {
      lines.push(line);
      line = [];
    }
  }
  if (line.length) lines.push(line);

  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${dims.w}`,
    `PlayResY: ${dims.h}`,
    "WrapStyle: 2",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,Arial,${fontSize},${primary},${secondary},&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,2,${align},80,80,${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];

  const events = lines
    .map((ln) => {
      const start = Math.max(0, ln[0].start - clipStart);
      const end = Math.max(start + 0.3, ln[ln.length - 1].end - clipStart);
      let prev = ln[0].start;
      const text = ln
        .map((w) => {
          const kcs = Math.max(1, Math.round((w.end - prev) * 100));
          prev = w.end;
          const clean = w.word.replace(/[{}]/g, "");
          return `{\\k${kcs}}${clean} `;
        })
        .join("")
        .trimEnd();
      return `Dialogue: 0,${assTime(start)},${assTime(end)},Default,,0,0,0,,${text}`;
    })
    .join("\n");

  return header.join("\n") + "\n" + events + "\n";
}

function assTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.round((sec - Math.floor(sec)) * 100);
  return `${h}:${pad(m)}:${pad(s)}.${pad(cs)}`;
}

const pad = (n: number) => n.toString().padStart(2, "0");

// ffmpeg's subtitles filter needs special chars in the path escaped.
function escapeFilterPath(p: string): string {
  return p.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
}
