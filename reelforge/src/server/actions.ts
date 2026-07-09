"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/session";
import { canCreateProject, canExport } from "@/lib/limits";
import { logEvent } from "@/lib/analytics";
import { getPlan } from "@/lib/plans";
import { enqueueProjectProcessing, enqueueExport } from "@/lib/queue";
import type { ExportFormat } from "@prisma/client";

// All mutations route through here. Each one re-checks the workspace so a user
// can never act on another workspace's data.

async function assertProjectAccess(projectId: string) {
  const { workspace } = await requireWorkspace();
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: workspace.id },
  });
  if (!project) throw new Error("Project not found");
  return { workspace, project };
}

export async function createProject(formData: FormData) {
  const { user, workspace } = await requireWorkspace();
  const title = String(formData.get("title") || "").trim() || "Untitled project";
  const templateKey = String(formData.get("templateKey") || "talking-head");

  const gate = await canCreateProject(workspace);
  if (!gate.ok) {
    redirect(`/settings?upgrade=1&reason=${encodeURIComponent(gate.reason!)}`);
  }

  // Attach the workspace's default brand kit if one exists.
  const brandKit = await prisma.brandKit.findFirst({
    where: { workspaceId: workspace.id, isDefault: true },
  });

  const project = await prisma.project.create({
    data: {
      title,
      templateKey,
      workspaceId: workspace.id,
      createdById: user.id,
      brandKitId: brandKit?.id ?? null,
      status: "DRAFT",
    },
  });

  await logEvent(workspace.id, "PROJECT_CREATED", { templateKey });
  await logEvent(workspace.id, "TEMPLATE_USED", { templateKey });
  redirect(`/projects/${project.id}`);
}

export async function reprocessProject(projectId: string) {
  const { project } = await assertProjectAccess(projectId);
  const video = await prisma.video.findUnique({ where: { projectId } });
  if (!video) throw new Error("Upload a video first");
  await prisma.project.update({
    where: { id: project.id },
    data: { status: "QUEUED" },
  });
  await enqueueProjectProcessing(project.id);
  revalidatePath(`/projects/${project.id}`);
}

export async function updateProjectTitle(projectId: string, title: string) {
  const { project } = await assertProjectAccess(projectId);
  await prisma.project.update({
    where: { id: project.id },
    data: { title: title.trim() || "Untitled project" },
  });
  revalidatePath(`/projects/${project.id}`);
}

export async function updateCaption(captionId: string, text: string) {
  const { workspace } = await requireWorkspace();
  // Ownership check across the relation chain.
  const caption = await prisma.caption.findFirst({
    where: { id: captionId, clip: { project: { workspaceId: workspace.id } } },
    include: { clip: true },
  });
  if (!caption) throw new Error("Caption not found");
  await prisma.caption.update({ where: { id: captionId }, data: { text } });
  revalidatePath(`/projects/${caption.clip.projectId}`);
}

export async function updateSocialPost(
  clipId: string,
  data: {
    title: string;
    hook: string;
    description: string;
    hashtags: string;
    cta: string;
  }
) {
  const { workspace } = await requireWorkspace();
  const clip = await prisma.clip.findFirst({
    where: { id: clipId, project: { workspaceId: workspace.id } },
  });
  if (!clip) throw new Error("Clip not found");

  const hashtags = data.hashtags
    .split(/[\s,]+/)
    .map((h) => h.trim())
    .filter(Boolean)
    .map((h) => (h.startsWith("#") ? h : `#${h}`));

  await prisma.socialPost.update({
    where: { clipId },
    data: {
      title: data.title,
      hook: data.hook,
      description: data.description,
      cta: data.cta,
      hashtags,
      edited: true,
    },
  });
  revalidatePath(`/projects/${clip.projectId}`);
}

export async function createExport(clipId: string, format: ExportFormat) {
  const { workspace } = await requireWorkspace();
  const clip = await prisma.clip.findFirst({
    where: { id: clipId, project: { workspaceId: workspace.id } },
    include: { project: true },
  });
  if (!clip) throw new Error("Clip not found");

  const gate = await canExport(workspace);
  if (!gate.ok) {
    redirect(`/settings?upgrade=1&reason=${encodeURIComponent(gate.reason!)}`);
  }

  // Create the export QUEUED and hand it to the job queue. The renderer
  // (src/lib/render.ts) reframes to the target aspect ratio and burns in
  // captions via ffmpeg, then flips the export to DONE with its file key.
  const exp = await prisma.export.create({
    data: { clipId, format, status: "QUEUED" },
  });
  await enqueueExport(exp.id);

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { exportsThisMonth: { increment: 1 } },
  });
  await logEvent(workspace.id, "EXPORT_CREATED", { format });
  revalidatePath(`/projects/${clip.projectId}`);
}

/** Bulk export: create an export in every format for every clip in a project. */
export async function bulkExportProject(
  projectId: string,
  formats: ExportFormat[]
) {
  const { workspace, project } = await assertProjectAccess(projectId);
  const plan = getPlan(workspace.planTier);
  if (!plan.features.includes("bulk_export")) {
    redirect(
      `/settings?upgrade=1&reason=${encodeURIComponent(
        "Bulk export is a Pro feature. Upgrade to export every clip at once."
      )}`
    );
  }
  const clips = await prisma.clip.findMany({ where: { projectId } });
  for (const clip of clips) {
    for (const format of formats) {
      const exp = await prisma.export.create({
        data: { clipId: clip.id, format, status: "QUEUED" },
      });
      await enqueueExport(exp.id);
      await logEvent(workspace.id, "EXPORT_CREATED", { format, bulk: true });
    }
  }
  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { exportsThisMonth: { increment: clips.length * formats.length } },
  });
  revalidatePath(`/projects/${project.id}`);
}

export async function saveBrandKit(
  brandKitId: string | null,
  data: {
    name: string;
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    toneOfVoice: string;
    ctaTemplates: string;
    logoKey?: string | null;
  }
) {
  const { workspace } = await requireWorkspace();
  const ctaTemplates = data.ctaTemplates
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (brandKitId) {
    const existing = await prisma.brandKit.findFirst({
      where: { id: brandKitId, workspaceId: workspace.id },
    });
    if (!existing) throw new Error("Brand kit not found");
    await prisma.brandKit.update({
      where: { id: brandKitId },
      data: { ...data, ctaTemplates, logoKey: data.logoKey ?? existing.logoKey },
    });
  } else {
    const plan = getPlan(workspace.planTier);
    const count = await prisma.brandKit.count({
      where: { workspaceId: workspace.id },
    });
    if (count >= plan.limits.brandKits) {
      redirect(
        `/settings?upgrade=1&reason=${encodeURIComponent(
          `Your plan allows ${plan.limits.brandKits} brand kit(s). Upgrade for more.`
        )}`
      );
    }
    await prisma.brandKit.create({
      data: {
        ...data,
        ctaTemplates,
        logoKey: data.logoKey ?? null,
        workspaceId: workspace.id,
        isDefault: count === 0,
      },
    });
  }
  revalidatePath("/brand-kit");
}

export async function completeOnboarding(data: {
  workspaceName: string;
  brandName: string;
  primaryColor: string;
  toneOfVoice: string;
}) {
  const { user, workspace } = await requireWorkspace();
  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { name: data.workspaceName || workspace.name },
  });
  const defaultKit = await prisma.brandKit.findFirst({
    where: { workspaceId: workspace.id, isDefault: true },
  });
  if (defaultKit) {
    await prisma.brandKit.update({
      where: { id: defaultKit.id },
      data: {
        name: data.brandName || defaultKit.name,
        primaryColor: data.primaryColor || defaultKit.primaryColor,
        toneOfVoice: data.toneOfVoice || defaultKit.toneOfVoice,
      },
    });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { onboarded: true },
  });
}
