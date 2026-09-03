import PropertyListingPage from "@/components/PropertyListingPage";

export const metadata = { title: "Buy Properties — Flex Home" };

export default function Page({ searchParams }) {
  return (
    <PropertyListingPage
      searchParams={searchParams}
      fixedListingType="sale"
      eyebrow="Buy"
      title="Properties for sale"
      subtitle="Verified listings, updated daily, from apartments to full estates."
    />
  );
}
