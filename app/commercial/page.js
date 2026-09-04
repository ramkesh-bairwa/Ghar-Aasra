import PropertyListingPage from "@/components/PropertyListingPage";

export const metadata = { title: "Commercial Properties — Flex Home" };

export default function Page({ searchParams }) {
  return (
    <PropertyListingPage
      searchParams={searchParams}
      fixedListingType="commercial"
      eyebrow="Commercial"
      title="Commercial properties"
      subtitle="Office space, retail units, and warehouses for lease or sale."
    />
  );
}
