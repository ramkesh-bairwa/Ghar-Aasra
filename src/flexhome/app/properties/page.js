import PropertyListingPage from "@/components/PropertyListingPage";

export const metadata = { title: "Search Properties — Flex Home" };

export default function Page({ searchParams }) {
  return (
    <PropertyListingPage
      searchParams={searchParams}
      eyebrow="Search"
      title="Find your next property"
      subtitle="Filter by type, city, and budget across every listing on Flex Home."
    />
  );
}
