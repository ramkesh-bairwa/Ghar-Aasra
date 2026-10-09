import { NextResponse } from "next/server";
import { incrementPropertyViews } from "@/lib/queries";

// Counts one view of a property page. The client only calls this once per
// browsing session per property (see PropertyViewTracker), so refreshes
// don't inflate the number shown on the page.
export async function POST(request, { params }) {
  await incrementPropertyViews(params.slug);
  return NextResponse.json({ ok: true });
}
