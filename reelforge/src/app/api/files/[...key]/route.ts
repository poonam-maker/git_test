import { NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { getSessionContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Serves files stored by the local storage driver. Access is gated: the
// requester must belong to the workspace that owns the video/logo.

export async function GET(
  _req: Request,
  { params }: { params: { key: string[] } }
) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = params.key.map(decodeURIComponent).join("/");

  // Authorize: the key must belong to a video, brand-kit logo, or rendered
  // export owned by this workspace.
  const [video, brandKit, exp, master] = await Promise.all([
    prisma.video.findFirst({
      where: { storageKey: key, project: { workspaceId: ctx.workspace.id } },
    }),
    prisma.brandKit.findFirst({
      where: { logoKey: key, workspaceId: ctx.workspace.id },
    }),
    prisma.export.findFirst({
      where: {
        storageKey: key,
        clip: { project: { workspaceId: ctx.workspace.id } },
      },
    }),
    prisma.editMaster.findFirst({
      where: { storageKey: key, project: { workspaceId: ctx.workspace.id } },
    }),
  ]);
  if (!video && !brandKit && !exp && !master) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const storage = getStorage();
    const buffer = await storage.get(key);
    const contentType =
      video?.mimeType || (exp || master ? "video/mp4" : "application/octet-stream");
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    };
    // Rendered exports download as a file.
    if (exp) {
      headers["Content-Disposition"] = `attachment; filename="${exp.format.toLowerCase()}-clip.mp4"`;
    }
    return new NextResponse(new Uint8Array(buffer), { headers });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
