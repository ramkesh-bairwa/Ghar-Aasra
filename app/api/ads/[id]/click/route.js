import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { safeAdLink } from "@/lib/ads";

export const dynamic = "force-dynamic";

// Banner links go through here so clicks are counted, then redirect.
export async function GET(request, { params }) {
  try {
    const [ad] = await query("SELECT link_url FROM ad_banners WHERE id = ? LIMIT 1", [Number(params.id)]);
    const link = safeAdLink(ad?.link_url);
    if (!link) return NextResponse.redirect(new URL("/", request.url));
    await query("UPDATE ad_banners SET clicks = clicks + 1 WHERE id = ?", [Number(params.id)]);
    return NextResponse.redirect(new URL(link, request.url));
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
