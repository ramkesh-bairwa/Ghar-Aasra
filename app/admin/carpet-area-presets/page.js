import { redirect } from "next/navigation";

// Carpet area presets were merged into Floor Plans & Sizes, the one list the
// property form and property pages use. Old links and bookmarks land there.
// Rendered per request so it issues a real redirect rather than a static page.
export const dynamic = "force-dynamic";

export default function Page() {
  redirect("/admin/floor-plans");
}
