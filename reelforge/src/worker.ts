import { Worker, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";
import { QUEUE_NAME } from "./lib/queue";
import { runProjectPipeline } from "./lib/jobs";
import { runExportJob } from "./lib/render";

// Standalone background worker (production job driver).
//
//   JOB_DRIVER=redis REDIS_URL=redis://localhost:6379 npm run worker
//
// Runs the same pipeline functions the inline driver runs, but off the request
// path — durable, retryable, and horizontally scalable (run N of these).

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("REDIS_URL is required to run the worker.");
  process.exit(1);
}

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
const concurrency = Number(process.env.WORKER_CONCURRENCY || 3);

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    switch (job.name) {
      case "project":
        await runProjectPipeline(job.data.projectId);
        break;
      case "export":
        await runExportJob(job.data.exportId);
        break;
      default:
        console.warn(`[worker] unknown job type: ${job.name}`);
    }
  },
  { connection: connection as unknown as ConnectionOptions, concurrency }
);

worker.on("completed", (job) => {
  console.log(`[worker] ${job.name} ${job.id} completed`);
});
worker.on("failed", (job, err) => {
  console.error(`[worker] ${job?.name} ${job?.id} failed:`, err.message);
});

console.log(`[worker] listening on "${QUEUE_NAME}" (concurrency ${concurrency})`);

async function shutdown() {
  console.log("[worker] shutting down…");
  await worker.close();
  await connection.quit();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
