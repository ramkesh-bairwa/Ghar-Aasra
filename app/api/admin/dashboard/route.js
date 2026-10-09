import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { canAccessSection } from "@/lib/adminPermissions";

export async function GET(request) {
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
    recentInquiries = await query(`SELECT id, name, email, phone, source, status, created_at FROM inquiries ORDER BY created_at DESC LIMIT 5`);
  } catch {
    /* ignore */
  }

  // Visit funnel — only for roles that can see bookings (it includes
  // customer phone numbers). "Today" comes from the admin's browser, since
  // bookings store the visitor's local wall-clock time and the DB server's
  // clock may sit in another timezone.
  let visits = null;
  const today = new URL(request.url).searchParams.get("today");
  if (connected && canAccessSection(admin.admin_role, "bookings") && /^\d{4}-\d{2}-\d{2}$/.test(today || "")) {
    try {
      const [summary] = await query(
        `SELECT
           (SELECT COUNT(*) FROM bookings WHERE DATE(scheduled_at) = ? AND status != 'cancelled') AS today,
           (SELECT COUNT(*) FROM bookings WHERE status = 'pending' AND DATE(scheduled_at) >= ?) AS pending,
           (SELECT COUNT(*) FROM bookings WHERE created_at >= NOW() - INTERVAL 30 DAY) AS booked30,
           (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND created_at >= NOW() - INTERVAL 30 DAY) AS completed30,
           (SELECT COUNT(*) FROM inquiries WHERE created_at >= NOW() - INTERVAL 30 DAY) AS leads30,
           (SELECT COUNT(*) FROM visit_requests WHERE status = 'new') AS newRequests,
           (SELECT COUNT(*) FROM inquiries WHERE source = 'callback' AND status = 'new') AS callbacks`,
        [today, today]
      );
      const todayList = await query(
        `SELECT b.id, b.scheduled_at, b.status, b.visit_type,
                COALESCE(u.name, b.guest_name) AS customer_name,
                COALESCE(b.guest_phone, u.phone) AS customer_phone,
                p.title AS property_title
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
         LEFT JOIN users u ON u.id = b.user_id
         WHERE DATE(b.scheduled_at) = ? AND b.status != 'cancelled'
         ORDER BY b.scheduled_at ASC`,
        [today]
      );
      visits = { ...summary, todayList };
    } catch {
      visits = null;
    }
  }

  return NextResponse.json({ connected, counts, recentInquiries, visits });
}
