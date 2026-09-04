import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { getZohoAuthUrl } from "@/lib/zoho";

// Starts the one-time OAuth consent flow. The redirect_uri here must be
// registered exactly (same protocol/host/port/path) for this client in the
// Zoho API console, or Zoho will reject the request with invalid_client.
export async function GET(request) {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const redirectUri = new URL("/api/admin/zoho/callback", request.url).toString();
  return NextResponse.redirect(getZohoAuthUrl(redirectUri));
}
