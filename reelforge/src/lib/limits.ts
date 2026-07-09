import { prisma } from "./prisma";
import { getPlan } from "./plans";
import type { Workspace } from "@prisma/client";

// Plan-limit enforcement. These checks are what make paid tiers meaningful:
// hitting a limit is the natural upgrade prompt.

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function canCreateProject(workspace: Workspace): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const plan = getPlan(workspace.planTier);
  if (plan.limits.projectsPerMonth === -1) return { ok: true };
  const count = await prisma.project.count({
    where: { workspaceId: workspace.id, createdAt: { gte: startOfMonth() } },
  });
  if (count >= plan.limits.projectsPerMonth) {
    return {
      ok: false,
      reason: `You've hit your ${plan.name} limit of ${plan.limits.projectsPerMonth} projects this month. Upgrade to create more.`,
    };
  }
  return { ok: true };
}

export async function canExport(workspace: Workspace): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const plan = getPlan(workspace.planTier);
  if (plan.limits.exportsPerMonth === -1) return { ok: true };
  const count = await prisma.export.count({
    where: {
      clip: { project: { workspaceId: workspace.id } },
      createdAt: { gte: startOfMonth() },
    },
  });
  if (count >= plan.limits.exportsPerMonth) {
    return {
      ok: false,
      reason: `You've reached your ${plan.name} export limit (${plan.limits.exportsPerMonth}/mo). Upgrade for more exports.`,
    };
  }
  return { ok: true };
}
