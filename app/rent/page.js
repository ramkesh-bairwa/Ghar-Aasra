import PropertyListingPage from "@/components/PropertyListingPage";

export const metadata = { title: "Rent Properties" };

export default function Page({ searchParams }) {
  return (
    <PropertyListingPage
      searchParams={searchParams}
      fixedListingType="rent"
      eyebrow="Rent"
      title="Properties for rent"
      subtitle="Flexible leases across houses, apartments, and villas."
    />
  );
}
