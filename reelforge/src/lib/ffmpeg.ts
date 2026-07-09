import { spawn } from "child_process";

// Thin wrapper around the ffmpeg binary, shared by the export renderer and the
// audio-extraction step. Set FFMPEG_PATH to point at a custom binary.

export const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

/**
 * Run ffmpeg with the given args. Rejects on non-zero exit or a spawn error
 * (e.g. ENOENT when ffmpeg isn't installed), so callers can fall back.
 */
export function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > 8000) stderr = stderr.slice(-8000);
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`));
    });
  });
}
