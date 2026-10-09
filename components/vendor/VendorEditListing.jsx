"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import ListingWizard from "@/components/vendor/listing/ListingWizard";

export default function VendorEditListing({ id, data }) {
  const [property, setProperty] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/vendor/properties/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load this listing.");
        setProperty(json.property);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  return (
    <div>
      <Link href="/vendor?view=listings" className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy-900 shadow-soft ring-1 ring-navy-900/5 hover:text-teal-600">
        <ArrowLeft size={15} /> Back to my listings
      </Link>
      {error ? (
        <p className="rounded-xl bg-coral-500/10 px-4 py-3 text-sm text-coral-600">{error}</p>
      ) : !property ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-20 text-sm text-navy-800/50 shadow-soft">
          <Loader2 size={16} className="animate-spin" /> Loading listing…
        </div>
      ) : (
        <ListingWizard data={data} initial={property} propertyId={property.id} />
      )}
    </div>
  );
}
