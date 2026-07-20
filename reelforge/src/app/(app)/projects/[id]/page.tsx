import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { getTemplate } from "@/lib/templates";
import { getPlan } from "@/lib/plans";
import { formatDuration } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Uploader } from "@/components/project/uploader";
import { ProcessingStatus } from "@/components/project/processing-status";
import { ClipCard } from "@/components/project/clip-card";
import { BulkExportBar } from "@/components/project/bulk-export-bar";
import { ExportsRefresher } from "@/components/project/exports-refresher";
import { reprocessProject } from "@/server/actions";

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const { workspace } = await requireWorkspace();
  const project = await prisma.project.findFirst({
    where: { id: params.id, workspaceId: workspace.id },
    include: {
      video: true,
      brandKit: true,
      editMaster: true,
      clips: {
        orderBy: { order: "asc" },
        include: {
          captions: { orderBy: { order: "asc" } },
          socialPost: true,
          exports: true,
        },
      },
    },
  });
  if (!project) notFound();

  const template = getTemplate(project.templateKey);
  const plan = getPlan(workspace.planTier);
  const storage = getStorage();
  const videoUrl = project.video ? storage.url(project.video.storageKey) : null;
  const isProcessing =
    project.status === "QUEUED" || project.status === "PROCESSING";

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <span>{template.emoji}</span>
            <span>{template.name}</span>
            {project.brandKit && (
              <>
                <span>·</span>
                <span>Brand: {project.brandKit.name}</span>
              </>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white">{project.title}</h1>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Video preview */}
      {videoUrl && (
        <div className="mt-6 overflow-hidden rounded-xl border border-white/5 bg-black">
          <video
            src={videoUrl}
            controls
            className="mx-auto max-h-[360px] w-full object-contain"
          />
          <div className="flex items-center justify-between px-4 py-2 text-xs text-ink-400">
            <span>{project.video?.originalName}</span>
            {project.video?.durationSec && (
              <span>{formatDuration(project.video.durationSec)}</span>
            )}
          </div>
        </div>
      )}

      {/* State-driven main area */}
      {!project.video && project.status === "DRAFT" && (
        <div className="mt-8">
          <Uploader projectId={project.id} />
        </div>
      )}

      {isProcessing && (
        <div className="mt-8">
          <ProcessingStatus projectId={project.id} />
        </div>
      )}

      {project.status === "FAILED" && (
        <div className="card mt-8 border-red-500/30 bg-red-500/5">
          <p className="font-semibold text-red-300">Processing failed</p>
          <p className="mt-1 text-sm text-ink-400">
            Something went wrong generating clips. You can retry.
          </p>
          <form
            action={async () => {
              "use server";
              await reprocessProject(project.id);
            }}
          >
            <button className="btn-secondary mt-4">Retry processing</button>
          </form>
        </div>
      )}

      {project.status === "READY" && (
        <div className="mt-8">
          <ExportsRefresher projectId={project.id} />

          {project.editMaster && (
            <EditMasterCard
              master={{
                originalSec: project.editMaster.originalSec,
                editedSec: project.editMaster.editedSec,
                removedFillerCount: project.editMaster.removedFillerCount,
                removedSilenceCount: project.editMaster.removedSilenceCount,
                url: project.editMaster.storageKey
                  ? storage.url(project.editMaster.storageKey)
                  : null,
              }}
            />
          )}

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {project.clips.length} clips ready
            </h2>
            <form
              action={async () => {
                "use server";
                await reprocessProject(project.id);
              }}
            >
              <button className="btn-ghost text-sm">↻ Re-process</button>
            </form>
          </div>

          <BulkExportBar
            projectId={project.id}
            canBulk={plan.features.includes("bulk_export")}
          />

          <div className="mt-5 space-y-5">
            {project.clips.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={{
                  id: clip.id,
                  title: clip.title,
                  startSec: clip.startSec,
                  endSec: clip.endSec,
                  score: clip.score,
                  captions: clip.captions.map((c) => ({
                    id: c.id,
                    text: c.text,
                    startSec: c.startSec,
                    endSec: c.endSec,
                  })),
                  social: clip.socialPost
                    ? {
                        title: clip.socialPost.title,
                        hook: clip.socialPost.hook,
                        description: clip.socialPost.description,
                        hashtags: clip.socialPost.hashtags,
                        cta: clip.socialPost.cta,
                      }
                    : null,
                  exports: clip.exports.map((e) => ({
                    id: e.id,
                    format: e.format,
                    status: e.status,
                    downloadUrl:
                      e.status === "DONE" && e.storageKey
                        ? storage.url(e.storageKey)
                        : null,
                  })),
                }}
                captionStyle={template.defaults.captionStyle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EditMasterCard({
  master,
}: {
  master: {
    originalSec: number;
    editedSec: number;
    removedFillerCount: number;
    removedSilenceCount: number;
    url: string | null;
  };
}) {
  const saved = Math.max(0, master.originalSec - master.editedSec);
  const pct =
    master.originalSec > 0 ? Math.round((saved / master.originalSec) * 100) : 0;

  return (
    <div className="card mb-6 border-brand-500/30 bg-brand-500/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✂️</span>
            <h2 className="text-lg font-semibold text-white">Edited master</h2>
          </div>
          <p className="mt-1 text-sm text-ink-400">
            Fillers and silences removed. Clips and exports below are cut from
            this tightened video.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="badge bg-ink-800 text-ink-200">
              {formatDuration(master.originalSec)} → {formatDuration(master.editedSec)}
            </span>
            {saved >= 1 && (
              <span className="badge bg-emerald-500/15 text-emerald-300">
                −{Math.round(saved)}s tighter ({pct}%)
              </span>
            )}
            {master.removedFillerCount > 0 && (
              <span className="badge bg-brand-500/15 text-brand-300">
                {master.removedFillerCount} fillers cut
              </span>
            )}
            {master.removedSilenceCount > 0 && (
              <span className="badge bg-brand-500/15 text-brand-300">
                {master.removedSilenceCount} silences cut
              </span>
            )}
          </div>
          {!master.url && (
            <p className="mt-3 text-xs text-amber-300/90">
              ffmpeg isn&apos;t available, so the tightened video wasn&apos;t
              rendered — clips use the original. Install ffmpeg (it&apos;s
              included in the Docker image) to get the edited master.
            </p>
          )}
        </div>

        {master.url && (
          <video
            src={master.url}
            controls
            className="max-h-56 w-full max-w-[220px] rounded-lg border border-white/10 bg-black"
          />
        )}
      </div>
    </div>
  );
}
