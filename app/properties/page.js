import PropertyListingPage from "@/components/PropertyListingPage";
import { getAllSiteSettings } from "@/lib/queries";

export const metadata = { title: "Search Properties" };

export default async function Page({ searchParams }) {
  const { site_title } = await getAllSiteSettings();
  return (
    <PropertyListingPage
      searchParams={searchParams}
      eyebrow="Search"
      title="Find your next property"
      subtitle={`Filter by type, city, and budget across every listing on ${site_title}.`}
    />
  );
}
