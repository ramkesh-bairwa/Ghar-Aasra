import { ImageResponse } from "next/og";
import { getAllSiteSettings } from "./queries";
import { themeIconSvg, customFavicon } from "./themeIcon";

const PNG_SIZES = [16, 32, 48, 180, 192, 512];

// Theme-coloured favicon response: a PNG at a known size, else the SVG.
// An admin-uploaded favicon wins everywhere — including /favicon.ico and
// the app manifest, which point here — via a redirect to the uploaded file.
export async function themeIconResponse(size, requestUrl) {
  const settings = await getAllSiteSettings();
  const custom = customFavicon(settings);
  if (custom && requestUrl) {
    return new Response(null, { status: 307, headers: { Location: new URL(custom, requestUrl).toString(), "Cache-Control": "no-cache" } });
  }
  // Short cache: URLs are versioned, and /favicon.ico should pick up changes quickly.
  const headers = { "Cache-Control": "public, max-age=60, stale-while-revalidate=600" };
  if (!PNG_SIZES.includes(size)) {
    return new Response(themeIconSvg(settings, 64), { headers: { ...headers, "Content-Type": "image/svg+xml" } });
  }
  const src = `data:image/svg+xml;base64,${Buffer.from(themeIconSvg(settings, size)).toString("base64")}`;
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return new ImageResponse(<img src={src} width={size} height={size} />, { width: size, height: size, headers });
}
