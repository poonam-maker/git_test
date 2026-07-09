import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@prisma/client";

const MAP: Record<ProjectStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-ink-600/40 text-ink-200" },
  UPLOADING: { label: "Uploading", className: "bg-amber-500/20 text-amber-300" },
  QUEUED: { label: "Queued", className: "bg-amber-500/20 text-amber-300" },
  PROCESSING: {
    label: "Processing",
    className: "bg-brand-500/20 text-brand-300 animate-pulse",
  },
  READY: { label: "Ready", className: "bg-emerald-500/20 text-emerald-300" },
  FAILED: { label: "Failed", className: "bg-red-500/20 text-red-300" },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const m = MAP[status];
  return <span className={cn("badge", m.className)}>{m.label}</span>;
}
