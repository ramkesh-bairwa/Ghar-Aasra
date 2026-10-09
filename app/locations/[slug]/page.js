import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { getLocationBySlug, listProperties } from "@/lib/queries";
import { MapPin } from "lucide-react";

export async function generateMetadata({ params }) {
  const location = await getLocationBySlug(params.slug);
  return { title: location ? `Properties in ${location.city}` : "Location" };
}

export default async function LocationDetailsPage({ params }) {
  const location = await getLocationBySlug(params.slug);
  if (!location) notFound();

  const properties = await listProperties({ city: location.city });

  return (
    <>
      <Header />
      <main>
        <div className="relative h-72 w-full">
          <img src={location.image} alt={location.city} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-navy-950/50" />
          <div className="container-page absolute inset-x-0 bottom-6">
            <span className="flex items-center gap-1.5 text-sm text-white/70">
              <MapPin size={14} /> {location.country}
            </span>
            <h1 className="mt-1 font-display text-3xl text-white md:text-4xl">{location.city}</h1>
            <p className="mt-2 max-w-lg text-[15px] text-white/70">{location.description}</p>
          </div>
        </div>

        <section className="bg-sand-50 py-12">
          <div className="container-page">
            <div className="mb-6 text-sm text-navy-800/55">
              {properties.length} {properties.length === 1 ? "property" : "properties"} in {location.city}
            </div>
            {properties.length === 0 ? (
              <p className="text-sm text-navy-800/55">No listings in this city yet — check back soon.</p>
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
