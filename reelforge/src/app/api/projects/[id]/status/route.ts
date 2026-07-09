import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/session";

// Lightweight polling endpoint the project page hits while processing runs.

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findFirst({
    where: { id: params.id, workspaceId: ctx.workspace.id },
    include: {
      jobs: { orderBy: { createdAt: "asc" } },
      _count: { select: { clips: true } },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: project.status,
    clipCount: project._count.clips,
    jobs: project.jobs.map((j) => ({
      type: j.type,
      status: j.status,
      progress: j.progress,
    })),
  });
}
