import { getActiveAds } from "@/lib/ads";
import AdBanner from "./AdBanner";

// Server-side slot: drop <AdSlot placement="home_middle" /> anywhere. Renders
// nothing when the admin has no live banner for that placement.
export default async function AdSlot({ placement, listingType, city, variant = "wide", className = "", wrap = false }) {
  const ads = await getActiveAds(placement, { listingType, city });
  if (!ads.length) return null;
  const banner = <AdBanner ads={ads} variant={variant} className={className} />;
  return wrap ? <section className="container-page py-6">{banner}</section> : banner;
}
