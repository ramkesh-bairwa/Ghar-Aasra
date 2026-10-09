import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForResource } from "@/lib/adminGuard";

export async function GET() {
  const admin = requireAdminForResource("pages");
  if (!admin) return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });
  try {
    const rows = await query("SELECT * FROM pages");
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ rows: [], error: err.message }, { status: 200 });
  }
}

export async function PUT(request) {
  const admin = requireAdminForResource("pages");
  if (!admin) return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

  const { slug, title, content } = await request.json();
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  try {
    await query(
      `INSERT INTO pages (slug, title, content) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content)`,
      [slug, title, content]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Save failed.", detail: err.message }, { status: 400 });
  }
}
