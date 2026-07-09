import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { getStorage, newKey } from "@/lib/storage";

export const runtime = "nodejs";

// Uploads a brand logo and returns its storage key. The brand-kit form saves
// that key alongside the rest of the kit via the saveBrandKit server action.

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Logo must be an image." }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Logo must be under 5MB." }, { status: 413 });
  }

  const storage = getStorage();
  const key = newKey(`logos/${ctx.workspace.id}`, file.name);
  await storage.put(key, Buffer.from(await file.arrayBuffer()), file.type);

  return NextResponse.json({ key, url: storage.url(key) });
}
