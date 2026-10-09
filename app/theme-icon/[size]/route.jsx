import { themeIconResponse } from "@/lib/themeIconResponse";

export const dynamic = "force-dynamic";

// /theme-icon/32 → 32px PNG (used by the /favicon.ico rewrite, which can't carry a query string).
export async function GET(request, { params }) {
  return themeIconResponse(Number(params.size), request.url);
}
