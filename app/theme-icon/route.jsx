import { themeIconResponse } from "@/lib/themeIconResponse";

export const dynamic = "force-dynamic";

// Theme-coloured favicon. /theme-icon → SVG; /theme-icon?size=32 → PNG
// (for browsers without SVG favicons, iOS home screen, app manifests).
export async function GET(request) {
  return themeIconResponse(Number(new URL(request.url).searchParams.get("size")), request.url);
}
