"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Job = { type: string; status: string; progress: number };

const STEP_LABELS: Record<string, string> = {
  TRANSCRIBE: "Transcribing audio",
  SILENCE_REMOVAL: "Removing silence & filler",
  CLIP_DETECTION: "Finding the best clips",
  CAPTION_GENERATION: "Writing captions",
  COPY_GENERATION: "Generating titles, hooks & hashtags",
};

// Polls the status endpoint while the pipeline runs. When the project becomes
// READY it refreshes the page (server component) to render the clips.

export function ProcessingStatus({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState("QUEUED");

  useEffect(() => {
    let active = true;
    const tick = async () => {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        cache: "no-store",
      });
      if (!res.ok || !active) return;
      const data = await res.json();
      setJobs(data.jobs);
      setStatus(data.status);
      if (data.status === "READY" || data.status === "FAILED") {
        router.refresh();
      }
    };
    tick();
    const id = setInterval(tick, 1500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [projectId, router]);

  const steps = Object.keys(STEP_LABELS);

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 animate-ping rounded-full bg-brand-500" />
        <h2 className="text-lg font-semibold text-white">
          {status === "QUEUED" ? "Queued for processing…" : "Processing your video…"}
        </h2>
      </div>
      <p className="mt-1 text-sm text-ink-400">
        This usually takes a moment. You can leave and come back.
      </p>

      <ul className="mt-6 space-y-3">
        {steps.map((step) => {
          const job = jobs.find((j) => j.type === step);
          const state = job?.status ?? "QUEUED";
          return (
            <li key={step} className="flex items-center gap-3">
              <span className="text-lg">
                {state === "DONE" ? "✅" : state === "RUNNING" ? "⏳" : "⚪"}
              </span>
              <span
                className={
                  state === "DONE"
                    ? "text-ink-300"
                    : state === "RUNNING"
                    ? "font-medium text-white"
                    : "text-ink-500"
                }
              >
                {STEP_LABELS[step]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
