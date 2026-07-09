import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/session";
import { getStorage, newKey } from "@/lib/storage";
import { getPlan } from "@/lib/plans";
import { logEvent } from "@/lib/analytics";
import { enqueueProjectProcessing } from "@/lib/jobs";

export const runtime = "nodejs";

// Receives the raw video file (multipart form-data), stores it via the storage
// driver, records a Video row, then enqueues the AI processing pipeline.

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findFirst({
    where: { id: params.id, workspaceId: ctx.workspace.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("video/")) {
    return NextResponse.json(
      { error: "Please upload a video file." },
      { status: 400 }
    );
  }

  const plan = getPlan(ctx.workspace.planTier);
  const maxBytes = plan.limits.maxUploadMinutes * 60 * 12 * 1024 * 1024; // rough ceiling
  if (file.size > maxBytes) {
    return NextResponse.json(
      {
        error: `File is too large for your plan (max ~${plan.limits.maxUploadMinutes} min). Upgrade for longer videos.`,
      },
      { status: 413 }
    );
  }

  const storage = getStorage();
  const key = newKey(`videos/${project.id}`, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  await storage.put(key, buffer, file.type);

  // Replace any prior upload for this project.
  await prisma.video.deleteMany({ where: { projectId: project.id } });
  await prisma.video.create({
    data: {
      projectId: project.id,
      storageKey: key,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });

  await prisma.project.update({
    where: { id: project.id },
    data: { status: "QUEUED" },
  });

  await logEvent(ctx.workspace.id, "VIDEO_UPLOADED", {
    projectId: project.id,
    sizeBytes: file.size,
  });

  // Kick off processing (inline driver runs it in the background).
  await enqueueProjectProcessing(project.id);

  return NextResponse.json({ ok: true });
}
