import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { listLocations } from "@/lib/queries";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Properties by Location" };

export default async function LocationsPage() {
  const locations = await listLocations();

  return (
    <>
      <Header />
      <main>
        <PageHeader eyebrow="Locations" title="Properties by location" subtitle="Every city page comes with its own price trends and neighborhood notes." />
        <section className="bg-sand-50 py-12">
          <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((l) => (
              <a key={l.slug} href={`/locations/${l.slug}`} className="card-surface group block overflow-hidden">
                <div className="relative h-44">
                  <img src={l.image} alt={l.city} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="font-display text-xl text-white">{l.city}</div>
                    <div className="text-xs text-white/70">{l.country}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-navy-800/60">{l.propertiesCount || "—"} listings</span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-teal-600">
                    Explore <ArrowRight size={14} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
