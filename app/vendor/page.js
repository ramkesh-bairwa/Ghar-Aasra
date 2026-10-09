import RequireAuth from "@/components/RequireAuth";
import SellerStudio from "@/components/vendor/SellerStudio";
import SellerGate from "@/components/vendor/SellerGate";

export const metadata = { title: "Seller Dashboard" };

// The seller dashboard is its own full-screen app (sidebar + views), so it
// skips the public site header and footer.
export default function VendorPage() {
  return (
    <RequireAuth>
      <SellerGate shell>
        <SellerStudio />
      </SellerGate>
    </RequireAuth>
  );
}
