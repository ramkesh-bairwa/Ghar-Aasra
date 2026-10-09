import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";

export async function GET() {
  const session = requireUser();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });

  const rows = await query(
    "SELECT id, name, email, phone, avatar_url, role, created_at FROM users WHERE id = ? LIMIT 1",
    [session.id]
  );
  if (!rows.length) return NextResponse.json({ authenticated: false }, { status: 401 });

  const user = rows[0];
  return NextResponse.json({
    authenticated: true,
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    role: user.role,
    memberSince: user.created_at,
  });
}
