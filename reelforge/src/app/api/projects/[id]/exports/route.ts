import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/session";

// Reports export render progress for a project. The project page polls this
// while any export is still QUEUED/RUNNING, then refreshes to show downloads.

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exports = await prisma.export.findMany({
    where: {
      clip: { projectId: params.id, project: { workspaceId: ctx.workspace.id } },
    },
    select: { id: true, status: true },
  });

  const pending = exports.filter(
    (e) => e.status === "QUEUED" || e.status === "RUNNING"
  ).length;

  return NextResponse.json({ total: exports.length, pending });
}
