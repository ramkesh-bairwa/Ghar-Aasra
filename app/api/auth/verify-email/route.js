import { NextResponse } from "next/server";
import { attachSessionCookie } from "@/lib/auth";
import { consumeEmailToken } from "@/lib/verificationStore";

// The link handed back by POST /api/auth (register, email, verification
// required). Visiting it consumes the token, signs the user in, and lands
// them on the homepage — the same one-click flow a real inbox link would give.
export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token");
  const entry = token && consumeEmailToken(token);
  if (!entry) {
    return NextResponse.redirect(new URL("/login?verify=expired", request.url));
  }

  const response = NextResponse.redirect(new URL("/?verified=1", request.url));
  return attachSessionCookie(response, { id: entry.userId, name: entry.name, identifier: entry.identifier });
}
