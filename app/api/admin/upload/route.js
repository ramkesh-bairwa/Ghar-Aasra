import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/adminGuard";

const VIDEO_EXT = { "video/mp4": "mp4", "video/webm": "webm", "video/ogg": "ogv", "video/quicktime": "mov" };
const IMAGE_EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico" };
// Floor plans, site plans and brochures are often PDFs.
const DOC_EXT = { "application/pdf": "pdf" };
const MAX_BYTES = { video: 100 * 1024 * 1024, image: 15 * 1024 * 1024, document: 20 * 1024 * 1024 };
const DIRS = { video: "videos", image: "images", document: "documents" };

export async function POST(request) {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const kind = VIDEO_EXT[file.type] ? "video" : IMAGE_EXT[file.type] ? "image" : DOC_EXT[file.type] ? "document" : null;
  if (!kind) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload an MP4/WebM/Ogg/MOV video, a JPG/PNG/WebP/GIF/ICO image or a PDF." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES[kind]) {
    return NextResponse.json({ error: `File is too large. Max size is ${MAX_BYTES[kind] / (1024 * 1024)}MB.` }, { status: 400 });
  }

  const ext = VIDEO_EXT[file.type] || IMAGE_EXT[file.type] || DOC_EXT[file.type];
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const subdir = DIRS[kind];
  const uploadDir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(uploadDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), bytes);

  return NextResponse.json({ ok: true, url: `/uploads/${subdir}/${filename}` });
}
