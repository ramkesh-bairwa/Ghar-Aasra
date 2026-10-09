import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

// `next start` only serves files that were in public/ at build time, but
// admin and seller uploads are written to public/uploads/ while the app is
// running. next.config.js falls back to this route for /uploads/* paths the
// static server didn't find, so uploaded photos, videos and documents work
// in production without a rebuild (and without needing nginx in front).
export const dynamic = "force-dynamic";

const ROOT = path.join(process.cwd(), "public", "uploads");

const TYPES = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".avif": "image/avif", ".ico": "image/x-icon",
  ".mp4": "video/mp4", ".webm": "video/webm", ".ogg": "video/ogg", ".mov": "video/quicktime", ".m4v": "video/mp4",
  ".pdf": "application/pdf",
};

export async function GET(request, { params }) {
  const file = path.resolve(ROOT, ...(params.path || []));
  // Never serve anything outside public/uploads (no ../ escapes).
  if (!file.startsWith(ROOT + path.sep)) return new Response("Not found", { status: 404 });

  let info;
  try {
    info = await stat(file);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!info.isFile()) return new Response("Not found", { status: 404 });

  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  const headers = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=604800",
    "Last-Modified": info.mtime.toUTCString(),
    // SVGs can carry script; keep them inert when opened directly.
    ...(type === "image/svg+xml" ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}),
  };

  // Byte ranges, so videos can seek and play on Safari / iOS.
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : info.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : info.size - 1;
    start = Math.max(0, start);
    end = Math.min(end, info.size - 1);
    if (start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    }
    return new Response(Readable.toWeb(createReadStream(file, { start, end })), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${info.size}`, "Content-Length": String(end - start + 1) },
    });
  }

  return new Response(Readable.toWeb(createReadStream(file)), {
    headers: { ...headers, "Content-Length": String(info.size) },
  });
}
