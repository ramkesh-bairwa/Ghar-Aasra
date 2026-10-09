import { notFound } from "next/navigation";
import { getAllSiteSettings } from "@/lib/queries";
import ReelsFeed from "@/components/reels/ReelsFeed";

export const metadata = { title: "Property Reels" };
export const dynamic = "force-dynamic";

export default async function ReelsPage({ searchParams }) {
  if ((await getAllSiteSettings()).reels_enabled === "false") notFound();
  return <ReelsFeed startId={searchParams.start || null} />;
}
