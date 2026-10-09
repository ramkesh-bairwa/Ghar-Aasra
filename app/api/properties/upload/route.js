import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireUser } from "@/lib/userGuard";

// Uploads for the seller listing form — same on-disk storage as the admin
// uploader, gated by a signed-in user session instead of an admin one.
// Images (photos, floor plans), videos (video tour) and PDFs (brochures).
const TYPES = {
  "image/jpeg": ["image", "jpg"], "image/png": ["image", "png"], "image/webp": ["image", "webp"], "image/gif": ["image", "gif"],
  "video/mp4": ["video", "mp4"], "video/webm": ["video", "webm"], "video/ogg": ["video", "ogv"], "video/quicktime": ["video", "mov"],
  "application/pdf": ["document", "pdf"],
};
const MAX_BYTES = { image: 15 * 1024 * 1024, video: 100 * 1024 * 1024, document: 20 * 1024 * 1024 };
const DIRS = { image: "images", video: "videos", document: "documents" };

export async function POST(request) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const [kind, ext] = TYPES[file.type] || [];
  if (!kind) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload a JPG/PNG/WebP image, an MP4/WebM/MOV video or a PDF." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES[kind]) {
    return NextResponse.json({ error: `File is too large. Max size is ${MAX_BYTES[kind] / (1024 * 1024)}MB.` }, { status: 400 });
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", DIRS[kind]);
  await mkdir(uploadDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), bytes);

  return NextResponse.json({ ok: true, url: `/uploads/${DIRS[kind]}/${filename}`, kind });
}
