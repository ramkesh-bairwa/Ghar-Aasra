import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET() {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, name: admin.name, email: admin.email });
}
