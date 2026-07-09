import type { ConnectionOptions } from "bullmq";
import { runProjectPipeline } from "./jobs";
import { runExportJob } from "./render";

// Job dispatch. Two drivers, selected by JOB_DRIVER:
//   - "inline" (default): run the work in-process, fire-and-forget, so HTTP
//     requests return immediately. Great for dev and small scale.
//   - "redis": enqueue to a BullMQ queue; a separate worker process
//     (`npm run worker`, see src/worker.ts) does the heavy lifting. This is the
//     production path — durable, retryable, and horizontally scalable.
//
// BullMQ/ioredis are imported dynamically so the dependency only loads when
// JOB_DRIVER=redis; inline mode has zero Redis footprint.

export const QUEUE_NAME = "reelforge";

export type JobName = "project" | "export";
export interface JobData {
  project: { projectId: string };
  export: { exportId: string };
}

function useRedis(): boolean {
  return (
    (process.env.JOB_DRIVER || "inline").toLowerCase() === "redis" &&
    Boolean(process.env.REDIS_URL)
  );
}

// Lazily-created singleton BullMQ queue (redis driver only).
let queuePromise: Promise<import("bullmq").Queue> | null = null;
async function getQueue(): Promise<import("bullmq").Queue> {
  if (!queuePromise) {
    queuePromise = (async () => {
      const { Queue } = await import("bullmq");
      const IORedis = (await import("ioredis")).default;
      const connection = new IORedis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: null,
      });
      // ioredis instance is runtime-compatible with BullMQ's bundled copy.
      return new Queue(QUEUE_NAME, {
        connection: connection as unknown as ConnectionOptions,
      });
    })();
  }
  return queuePromise;
}

const DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

export async function enqueueProjectProcessing(projectId: string): Promise<void> {
  if (useRedis()) {
    const q = await getQueue();
    await q.add("project", { projectId }, DEFAULT_JOB_OPTS);
    return;
  }
  void runProjectPipeline(projectId).catch((err) =>
    console.error("[queue] inline project pipeline failed", projectId, err)
  );
}

export async function enqueueExport(exportId: string): Promise<void> {
  if (useRedis()) {
    const q = await getQueue();
    await q.add("export", { exportId }, DEFAULT_JOB_OPTS);
    return;
  }
  void runExportJob(exportId).catch((err) =>
    console.error("[queue] inline export render failed", exportId, err)
  );
}
