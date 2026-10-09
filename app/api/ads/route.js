import { NextResponse } from "next/server";
import { getActiveAds } from "@/lib/ads";

export const dynamic = "force-dynamic";

// Live banners for client-side slots (popup, announcement bar).
export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  const ads = await getActiveAds(sp.get("placement"), { listingType: sp.get("listingType"), city: sp.get("city") });
  return NextResponse.json({ ads });
}
