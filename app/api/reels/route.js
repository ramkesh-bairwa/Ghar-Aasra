import { NextResponse } from "next/server";
import { requireUser } from "@/lib/userGuard";
import { listPublicReels } from "@/lib/reels";
import { getAllSiteSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if ((await getAllSiteSettings()).reels_enabled === "false") return NextResponse.json({ reels: [] });
  const user = requireUser();
  const start = new URL(request.url).searchParams.get("start");
  const reels = await listPublicReels({ limit: 50, userId: user?.id, startId: start });
  return NextResponse.json({ reels });
}
