import { NextResponse } from "next/server";
import { listProperties } from "@/lib/queries";

// Read-only feed for client components (favorites, compare, map) that need
// the full listing but can't call the server-only lib/queries functions
// directly from the browser.
export async function GET() {
  const properties = await listProperties();
  return NextResponse.json({ properties });
}
