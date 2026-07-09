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

  // Authorize: the key must belong to a video or brand kit in this workspace.
  const [video, brandKit] = await Promise.all([
    prisma.video.findFirst({
      where: { storageKey: key, project: { workspaceId: ctx.workspace.id } },
    }),
    prisma.brandKit.findFirst({
      where: { logoKey: key, workspaceId: ctx.workspace.id },
    }),
  ]);
  if (!video && !brandKit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const storage = getStorage();
    const buffer = await storage.get(key);
    const contentType = video?.mimeType || "application/octet-stream";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
