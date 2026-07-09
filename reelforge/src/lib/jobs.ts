import { prisma } from "./prisma";
import { getAIProvider } from "./ai";
import { getTemplate } from "./templates";
import { logEvent } from "./analytics";
import type { TranscriptSegment } from "./ai/types";

// Background processing pipeline.
//
// Driver model:
//   - "inline"  : run the pipeline in-process (dev / small scale). We fire it
//                 without awaiting so the HTTP request returns immediately and
//                 the UI can poll job status.
//   - "redis"   : stub — enqueue to BullMQ and let a separate worker run
//                 `runProjectPipeline`. Same function body, different trigger.
//
// The pipeline is intentionally idempotent-ish: it clears prior AI outputs for
// the project before regenerating, so "re-process" works.

export async function enqueueProjectProcessing(projectId: string): Promise<void> {
  const driver = (process.env.JOB_DRIVER || "inline").toLowerCase();
  if (driver === "redis") {
    // TODO: enqueue to BullMQ here. For now, fall through to inline.
    console.warn("[jobs] JOB_DRIVER=redis not wired; running inline.");
  }
  // Do not await — let it run in the background.
  void runProjectPipeline(projectId).catch((err) => {
    console.error("[jobs] pipeline failed", projectId, err);
  });
}

const STEPS = [
  "TRANSCRIBE",
  "SILENCE_REMOVAL",
  "CLIP_DETECTION",
  "CAPTION_GENERATION",
  "COPY_GENERATION",
] as const;

export async function runProjectPipeline(projectId: string): Promise<void> {
  const ai = getAIProvider();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { video: true, brandKit: true },
  });
  if (!project || !project.video) throw new Error("Project or video missing");

  const template = getTemplate(project.templateKey);
  const durationSec = project.video.durationSec ?? estimateDuration(project.video.sizeBytes);

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "PROCESSING" },
  });

  // Fresh set of job rows for this run + clear prior AI output.
  await prisma.processingJob.deleteMany({ where: { projectId } });
  await prisma.clip.deleteMany({ where: { projectId } });
  const jobs: Record<string, string> = {};
  for (const type of STEPS) {
    const job = await prisma.processingJob.create({
      data: { projectId, type: type as any, status: "QUEUED" },
    });
    jobs[type] = job.id;
  }

  try {
    // 1. Transcribe
    await start(jobs.TRANSCRIBE);
    const transcript = await ai.transcribe({
      storageKey: project.video.storageKey,
      durationSec,
    });
    await prisma.video.update({
      where: { id: project.video.id },
      data: { transcript: transcript as any, durationSec },
    });
    await finish(jobs.TRANSCRIBE);

    // 2. Silence / filler detection (informational for the editor UI)
    await start(jobs.SILENCE_REMOVAL);
    const gaps = await ai.detectSilence(transcript);
    await finish(jobs.SILENCE_REMOVAL);

    // 3. Clip detection -> persist clips
    await start(jobs.CLIP_DETECTION);
    const suggestions = await ai.suggestClips({
      transcript,
      durationSec,
      targetClipSeconds: template.defaults.targetClipSeconds,
    });
    const clips = [];
    for (let i = 0; i < suggestions.length; i++) {
      const s = suggestions[i];
      const clip = await prisma.clip.create({
        data: {
          projectId,
          title: s.title,
          startSec: s.startSec,
          endSec: s.endSec,
          score: s.score,
          order: i,
        },
      });
      clips.push(clip);
      await logEvent(project.workspaceId, "CLIP_CREATED", { clipId: clip.id });
    }
    await finish(jobs.CLIP_DETECTION);

    // 4. Captions per clip
    await start(jobs.CAPTION_GENERATION);
    for (const clip of clips) {
      const lines = await ai.generateCaptions({
        transcript,
        startSec: clip.startSec,
        endSec: clip.endSec,
      });
      if (lines.length > 0) {
        await prisma.caption.createMany({
          data: lines.map((l, idx) => ({
            clipId: clip.id,
            startSec: l.startSec,
            endSec: l.endSec,
            text: l.text,
            order: idx,
          })),
        });
      }
    }
    await finish(jobs.CAPTION_GENERATION);

    // 5. Social copy per clip (brand-aware)
    await start(jobs.COPY_GENERATION);
    for (const clip of clips) {
      const clipText = transcriptTextFor(transcript, clip.startSec, clip.endSec);
      const copy = await ai.generateSocialCopy({
        clipTitle: clip.title,
        transcriptText: clipText,
        templateTone: template.defaults.tone,
        brand: project.brandKit
          ? {
              name: project.brandKit.name,
              tone: project.brandKit.toneOfVoice,
              ctaTemplates: project.brandKit.ctaTemplates,
            }
          : undefined,
      });
      await prisma.socialPost.create({
        data: {
          clipId: clip.id,
          title: copy.title,
          hook: copy.hook,
          description: copy.description,
          hashtags: copy.hashtags,
          cta: copy.cta,
        },
      });
    }
    await finish(jobs.COPY_GENERATION);

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "READY" },
    });
    await logEvent(project.workspaceId, "PROCESSING_COMPLETED", {
      clips: clips.length,
      silenceGaps: gaps.length,
    });
  } catch (err: any) {
    console.error("[jobs] pipeline error", err);
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "FAILED" },
    });
    // Mark any unfinished job as failed.
    await prisma.processingJob.updateMany({
      where: { projectId, status: { in: ["QUEUED", "RUNNING"] } },
      data: { status: "FAILED", error: String(err?.message || err) },
    });
    throw err;
  }
}

async function start(jobId: string) {
  await prisma.processingJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", progress: 10 },
  });
}

async function finish(jobId: string) {
  await prisma.processingJob.update({
    where: { id: jobId },
    data: { status: "DONE", progress: 100 },
  });
}

function transcriptTextFor(
  transcript: TranscriptSegment[],
  startSec: number,
  endSec: number
): string {
  return transcript
    .filter((s) => s.end > startSec && s.start < endSec)
    .map((s) => s.text)
    .join(" ");
}

// Rough fallback when we can't probe real video duration in this MVP:
// assume ~1MB ≈ 6 seconds of compressed 1080p talking-head footage.
function estimateDuration(sizeBytes: number): number {
  const est = (sizeBytes / (1024 * 1024)) * 6;
  return Math.max(20, Math.min(est, 1800));
}
