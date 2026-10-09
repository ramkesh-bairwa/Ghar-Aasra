import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { sectionsFor } from "@/lib/adminPermissions";

export async function GET() {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({
    authenticated: true,
    name: admin.name,
    email: admin.email,
    adminRole: admin.admin_role || "super_admin",
    sections: sectionsFor(admin.admin_role), // null = every section
  });
}
