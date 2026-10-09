import { notFound } from "next/navigation";
import PropertyListingPage from "@/components/PropertyListingPage";
import { isCommercialEnabled } from "@/lib/queries";

export const metadata = { title: "Commercial Properties" };

export default async function Page({ searchParams }) {
  if (!(await isCommercialEnabled())) notFound();
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
