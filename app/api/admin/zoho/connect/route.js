import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { getZohoAuthUrl } from "@/lib/zoho";

// Starts the one-time OAuth consent flow. The redirect_uri here must be
// registered exactly (same protocol/host/port/path) for this client in the
// Zoho API console, or Zoho will reject the request with invalid_client.
export async function GET(request) {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  // Linking the company calendar is a full-admin action, not a staff one.
  if (admin.admin_role && admin.admin_role !== "super_admin") {
    return NextResponse.json({ error: "Only a full admin can connect Zoho." }, { status: 403 });
  }

  const redirectUri = new URL("/api/admin/zoho/callback", request.url).toString();
  return NextResponse.redirect(getZohoAuthUrl(redirectUri));
}
