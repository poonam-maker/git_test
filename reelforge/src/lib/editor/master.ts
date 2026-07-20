import { promises as fs } from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { getStorage } from "../storage";
import { runFfmpeg } from "../ffmpeg";
import type { EditRange } from "./autocut";

// Render the edited master: keep only the `keep` ranges and stitch them back
// into one continuous video. Done in a single ffmpeg pass using the select /
// aselect filters (no temp segment files), which drops the cut regions and
// re-times the result to a gapless timeline.

export async function renderEditedMaster(input: {
  sourceKey: string;
  sourceName: string;
  projectId: string;
  keep: EditRange[];
}): Promise<string> {
  const storage = getStorage();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "reelforge-edit-"));
  const inExt = path.extname(input.sourceName) || ".mp4";
  const inputPath = path.join(tmpDir, `in${inExt}`);
  const outputPath = path.join(tmpDir, "master.mp4");

  try {
    const bytes = await storage.get(input.sourceKey);
    await fs.writeFile(inputPath, bytes);

    // Build a boolean expression true inside any kept range.
    const between = input.keep
      .map((r) => `between(t,${r.start.toFixed(3)},${r.end.toFixed(3)})`)
      .join("+");
    const expr = input.keep.length > 0 ? between : "1";

    const args = [
      "-y",
      "-i", inputPath,
      "-vf", `select='${expr}',setpts=N/FRAME_RATE/TB`,
      "-af", `aselect='${expr}',asetpts=N/SR/TB`,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-c:a", "aac",
      "-movflags", "+faststart",
      outputPath,
    ];
    await runFfmpeg(args);

    const outBytes = await fs.readFile(outputPath);
    const key = `masters/${input.projectId}/${crypto.randomBytes(6).toString("hex")}.mp4`;
    await storage.put(key, outBytes, "video/mp4");
    return key;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
