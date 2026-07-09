"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { bulkExportProject } from "@/server/actions";
import type { ExportFormat } from "@prisma/client";

const FORMATS: { key: ExportFormat; label: string }[] = [
  { key: "TIKTOK", label: "TikTok" },
  { key: "REELS", label: "Reels" },
  { key: "SHORTS", label: "Shorts" },
];

// A sellable Pro feature: export every clip to every selected platform at once.

export function BulkExportBar({
  projectId,
  canBulk,
}: {
  projectId: string;
  canBulk: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<Set<ExportFormat>>(
    new Set(["TIKTOK", "REELS", "SHORTS"])
  );

  function toggle(f: ExportFormat) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  }

  function run() {
    start(async () => {
      await bulkExportProject(projectId, Array.from(selected));
      router.refresh();
    });
  }

  return (
    <div className="card flex flex-col gap-3 border-brand-500/30 bg-brand-500/5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-white">
          Bulk export bundle{" "}
          {!canBulk && <span className="badge ml-1 bg-brand-500/20 text-brand-300">Pro</span>}
        </p>
        <p className="text-xs text-ink-400">
          Export all clips to every selected platform in one click.
        </p>
      </div>

      {canBulk ? (
        <div className="flex flex-wrap items-center gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.key}
              onClick={() => toggle(f.key)}
              className={cn(
                "btn text-xs",
                selected.has(f.key)
                  ? "bg-brand-600 text-white"
                  : "btn-secondary"
              )}
            >
              {selected.has(f.key) ? "✓ " : ""}
              {f.label}
            </button>
          ))}
          <button
            onClick={run}
            disabled={pending || selected.size === 0}
            className="btn-primary"
          >
            {pending ? "Exporting…" : "Export all"}
          </button>
        </div>
      ) : (
        <Link href="/settings?upgrade=1" className="btn-primary">
          Upgrade to unlock
        </Link>
      )}
    </div>
  );
}
