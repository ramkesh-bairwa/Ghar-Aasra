import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireUser } from "@/lib/userGuard";

// Image upload for the public "Add Property" form — same on-disk storage as
// the admin uploader, but gated by a signed-in buyer session instead of an
// admin one, and images only (no video needed for a self-submitted listing).
const IMAGE_EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(request) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const ext = IMAGE_EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported file type. Upload a JPG, PNG, WebP, or GIF image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File is too large. Max size is ${MAX_BYTES / (1024 * 1024)}MB.` }, { status: 400 });
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "images");
  await mkdir(uploadDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), bytes);

  return NextResponse.json({ ok: true, url: `/uploads/images/${filename}` });
}
