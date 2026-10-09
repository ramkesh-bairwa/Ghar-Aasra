import RequireAuth from "@/components/RequireAuth";
import StudioShell from "@/components/vendor/StudioShell";
import ListingWizard from "@/components/vendor/listing/ListingWizard";
import { getSellerFormData } from "@/lib/sellerFormData";
import SellerGate from "@/components/vendor/SellerGate";

export const metadata = { title: "New Listing" };

export default async function NewListingPage() {
  const data = await getSellerFormData();
  return (
    <RequireAuth>
      <StudioShell active="new" title="Add a new property" subtitle="A few quick steps — type, details, price, photos — and you're live.">
        <SellerGate>
          <ListingWizard data={data} />
        </SellerGate>
      </StudioShell>
    </RequireAuth>
  );
}
