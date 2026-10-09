import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { hashPassword } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/adminPermissions";

// Only a full admin (admin_role null/"super_admin") can manage staff accounts —
// staff can't grant themselves or anyone else more access than they have.
function requireSuperAdmin() {
  const admin = requireAdmin();
  if (!admin) return null;
  return !admin.admin_role || admin.admin_role === "super_admin" ? admin : null;
}

export async function GET() {
  if (!requireSuperAdmin()) return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });
  try {
    const rows = await query(
      "SELECT id, name, email, admin_role, status, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC"
    );
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: "Could not reach MySQL.", detail: err.message }, { status: 503 });
  }
}

export async function POST(request) {
  if (!requireSuperAdmin()) return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

  const { name, email, password, admin_role } = await request.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (admin_role && !ADMIN_ROLES.includes(admin_role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  try {
    const password_hash = await hashPassword(password);
    const result = await query(
      "INSERT INTO users (name, email, password_hash, role, admin_role) VALUES (?, ?, ?, 'admin', ?)",
      [name, email, password_hash, admin_role || "super_admin"]
    );
    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    const isDup = err.code === "ER_DUP_ENTRY";
    return NextResponse.json(
      { error: isDup ? "An account with that email already exists." : "Could not create staff account.", detail: err.message },
      { status: 400 }
    );
  }
}
