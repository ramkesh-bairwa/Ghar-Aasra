import RequireAuth from "@/components/RequireAuth";
import StudioShell from "@/components/vendor/StudioShell";
import VendorEditListing from "@/components/vendor/VendorEditListing";
import { getSellerFormData } from "@/lib/sellerFormData";
import SellerGate from "@/components/vendor/SellerGate";

export const metadata = { title: "Edit Listing" };

export default async function EditListingPage({ params }) {
  const data = await getSellerFormData();
  return (
    <RequireAuth>
      <StudioShell active="listings" title="Edit listing" subtitle="Jump to any step, change what you need, then save.">
        <SellerGate>
          <VendorEditListing id={params.id} data={data} />
        </SellerGate>
      </StudioShell>
    </RequireAuth>
  );
}
