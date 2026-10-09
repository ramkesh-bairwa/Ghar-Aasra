import { getAllSiteSettings } from "@/lib/queries";
import { faviconVersion } from "@/lib/themeIcon";

// Web app manifest (add to home screen), named and coloured from Site Settings.
export default async function manifest() {
  const s = await getAllSiteSettings();
  const v = faviconVersion(s);
  return {
    name: s.site_title,
    short_name: s.site_title,
    description: s.meta_description,
    start_url: "/",
    display: "standalone",
    theme_color: s.primary_color || "#0f1b2d",
    background_color: s.background_color || "#f8f7f4",
    icons: [
      { src: `/theme-icon?size=192&v=${v}`, sizes: "192x192", type: "image/png" },
      { src: `/theme-icon?size=512&v=${v}`, sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
