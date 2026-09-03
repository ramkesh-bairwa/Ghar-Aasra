import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import PropertyFilters from "@/components/PropertyFilters";
import PropertyCard from "@/components/PropertyCard";
import { listProperties } from "@/lib/queries";
import { SearchX } from "lucide-react";

export default async function PropertyListingPage({
  searchParams,
  fixedListingType,
  title,
  subtitle,
  eyebrow,
}) {
  const filters = {
    listingType: fixedListingType || searchParams.listingType || undefined,
    propertyType: searchParams.propertyType || undefined,
    city: searchParams.city || undefined,
    minPrice: searchParams.minPrice || undefined,
    maxPrice: searchParams.maxPrice || undefined,
    minBedrooms: searchParams.minBedrooms || undefined,
    minBathrooms: searchParams.minBathrooms || undefined,
    furnishing: searchParams.furnishing || undefined,
    feature: searchParams.feature || undefined,
  };
  const properties = await listProperties(filters);

  return (
    <>
      <Header />
      <main>
        <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

        <section className="bg-sand-50 py-10">
          <div className="container-page">
            <Suspense fallback={null}>
              <PropertyFilters hideListingType={!!fixedListingType} />
            </Suspense>

            <div className="mt-2 flex items-center justify-between py-4 text-sm text-navy-800/55">
              <span>{properties.length} {properties.length === 1 ? "property" : "properties"} found</span>
            </div>

            {properties.length === 0 ? (
              <div className="card-surface flex flex-col items-center gap-3 py-16 text-center">
                <SearchX className="text-navy-800/30" size={32} />
                <p className="text-sm text-navy-800/60">No properties match those filters yet. Try widening your search.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((p) => (
                  <PropertyCard key={p.slug} property={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
