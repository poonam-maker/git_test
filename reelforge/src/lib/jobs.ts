import { prisma } from "./prisma";
import { getAIProvider } from "./ai";
import { getTemplate } from "./templates";
import { logEvent } from "./analytics";
import { getFullTranscript } from "./editor/transcribe";
import { planEdit, remapWords, buildEditedSegments } from "./editor/autocut";
import { renderEditedMaster } from "./editor/master";
import { transcriptTextFor } from "./ai/heuristics";
import type { TranscriptSegment, TranscriptWord } from "./ai/types";

// AI processing pipeline. Runs on the job queue (inline or the BullMQ worker).
//
// The order reflects the product: EDIT FIRST, then repurpose.
//   1. Transcribe (word-level)
//   2. Auto-edit master — cut fillers + silences, render the tightened video,
//      and remap the transcript onto the shortened timeline
//   3. Detect clips  ─┐
//   4. Captions       ├─ all run on the EDITED timeline / edited master
//   5. Social copy   ─┘
//
// Everything downstream uses the edited master, so clips and exports are cut
// from the polished video, not the raw upload.

const STEPS = [
  "TRANSCRIBE",
  "SILENCE_REMOVAL", // = auto-edit (cut fillers + silence, render master)
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

  const video = project.video;
  const template = getTemplate(project.templateKey);
  const estDuration = video.durationSec ?? estimateDuration(video.sizeBytes);

  await prisma.project.update({ where: { id: projectId }, data: { status: "PROCESSING" } });

  // Fresh run: clear prior jobs, clips, and edit master.
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
    // 1. Transcribe (word-level timestamps).
    await start(jobs.TRANSCRIBE);
    const { segments, words } = await getFullTranscript(
      video.storageKey,
      video.sizeBytes,
      estDuration
    );
    const originalSec = deriveDuration(words, segments, estDuration);
    await prisma.video.update({
      where: { id: video.id },
      data: { transcript: segments as any, words: words as any, durationSec: originalSec },
    });
    await finish(jobs.TRANSCRIBE);

    // 2. Auto-edit master: cut fillers + silence, render the tightened video.
    await start(jobs.SILENCE_REMOVAL);
    const plan = planEdit(words, originalSec, {
      aggressiveness: template.defaults.silenceAggressiveness,
    });

    // Work timeline downstream steps use. Defaults to the edit; on ffmpeg
    // failure we fall back to the original video + timeline so nothing breaks.
    let masterKey: string | null = null;
    let timelineSegments: TranscriptSegment[] = buildEditedSegments(
      remapWords(words, plan.keep)
    );
    let timelineWords: TranscriptWord[] = remapWords(words, plan.keep);
    let editedSec = plan.editedSec;
    let removed = plan.removed;
    let fillerCount = plan.removedFillerCount;
    let silenceCount = plan.removedSilenceCount;

    try {
      masterKey = await renderEditedMaster({
        sourceKey: video.storageKey,
        sourceName: video.originalName,
        projectId,
        keep: plan.keep,
      });
    } catch (err) {
      console.warn("[jobs] edited-master render failed; using original video.", err);
      masterKey = null;
      timelineSegments = segments;
      timelineWords = words;
      editedSec = originalSec;
      removed = [];
      fillerCount = 0;
      silenceCount = 0;
    }

    await prisma.editMaster.upsert({
      where: { projectId },
      create: {
        projectId,
        storageKey: masterKey,
        status: "DONE",
        originalSec,
        editedSec,
        removedFillerCount: fillerCount,
        removedSilenceCount: silenceCount,
        removed: removed as any,
        transcript: timelineSegments as any,
        words: timelineWords as any,
      },
      update: {
        storageKey: masterKey,
        status: "DONE",
        originalSec,
        editedSec,
        removedFillerCount: fillerCount,
        removedSilenceCount: silenceCount,
        removed: removed as any,
        transcript: timelineSegments as any,
        words: timelineWords as any,
      },
    });
    await finish(jobs.SILENCE_REMOVAL);

    // 3. Clip detection over the EDITED timeline.
    await start(jobs.CLIP_DETECTION);
    const suggestions = await ai.suggestClips({
      transcript: timelineSegments,
      durationSec: editedSec,
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

    // 4. Captions per clip (line-level fallback; animated words come at export).
    await start(jobs.CAPTION_GENERATION);
    for (const clip of clips) {
      const lines = await ai.generateCaptions({
        transcript: timelineSegments,
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

    // 5. Social copy per clip (brand-aware).
    await start(jobs.COPY_GENERATION);
    for (const clip of clips) {
      const clipText = transcriptTextFor(timelineSegments, clip.startSec, clip.endSec);
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

    await prisma.project.update({ where: { id: projectId }, data: { status: "READY" } });
    await logEvent(project.workspaceId, "PROCESSING_COMPLETED", {
      clips: clips.length,
      removedFillers: fillerCount,
      removedSilences: silenceCount,
      secondsSaved: Math.round(originalSec - editedSec),
    });
  } catch (err: any) {
    console.error("[jobs] pipeline error", err);
    await prisma.project.update({ where: { id: projectId }, data: { status: "FAILED" } });
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

function deriveDuration(
  words: TranscriptWord[],
  segments: TranscriptSegment[],
  fallback: number
): number {
  if (words.length > 0) return Math.max(...words.map((w) => w.end)) + 0.3;
  if (segments.length > 0) return segments[segments.length - 1].end + 0.3;
  return fallback;
}

// Rough fallback when we can't probe real video duration in this MVP.
function estimateDuration(sizeBytes: number): number {
  const est = (sizeBytes / (1024 * 1024)) * 6;
  return Math.max(20, Math.min(est, 1800));
}
