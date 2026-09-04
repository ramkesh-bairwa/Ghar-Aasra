import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET() {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const tables = ["properties", "projects", "agents", "developers", "blog_posts", "faqs", "inquiries"];
  const counts = {};
  let connected = true;

  for (const t of tables) {
    try {
      const rows = await query(`SELECT COUNT(*) AS n FROM ${t}`);
      counts[t] = rows[0]?.n ?? 0;
    } catch {
      connected = false;
      counts[t] = null;
    }
  }

  let recentInquiries = [];
  try {
    recentInquiries = await query(`SELECT id, name, email, status, created_at FROM inquiries ORDER BY created_at DESC LIMIT 5`);
  } catch {
    /* ignore */
  }

  return NextResponse.json({ connected, counts, recentInquiries });
}
