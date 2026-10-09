import { redirect } from "next/navigation";

// Listing creation lives in the seller panel now.
export default function AddPropertyPage() {
  redirect("/vendor/new");
}
