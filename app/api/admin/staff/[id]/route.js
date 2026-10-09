import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { hashPassword } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/adminPermissions";

function requireSuperAdmin() {
  const admin = requireAdmin();
  if (!admin) return null;
  return !admin.admin_role || admin.admin_role === "super_admin" ? admin : null;
}

export async function PUT(request, { params }) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

  const { name, email, password, admin_role, status } = await request.json();
  if (admin_role && !ADMIN_ROLES.includes(admin_role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const sets = [];
  const values = [];
  if (name) { sets.push("name = ?"); values.push(name); }
  if (email) { sets.push("email = ?"); values.push(email); }
  if (admin_role) { sets.push("admin_role = ?"); values.push(admin_role); }
  if (status) { sets.push("status = ?"); values.push(status); }
  if (password) { sets.push("password_hash = ?"); values.push(await hashPassword(password)); }
  if (!sets.length) return NextResponse.json({ error: "No valid fields submitted." }, { status: 400 });
  values.push(params.id);

  try {
    await query(`UPDATE users SET ${sets.join(", ")} WHERE id = ? AND role = 'admin'`, values);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Update failed.", detail: err.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

  if (String(admin.id) === String(params.id)) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }

  try {
    await query("DELETE FROM users WHERE id = ? AND role = 'admin'", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Delete failed.", detail: err.message }, { status: 400 });
  }
}
