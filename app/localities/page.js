import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import LocalityCard from "@/components/localities/LocalityCard";
import { listPublicLocalities } from "@/lib/localities";
import { getAllSiteSettings } from "@/lib/queries";
import { MapPinned } from "lucide-react";

export const metadata = { title: "Localities & Price Guides" };
export const dynamic = "force-dynamic";

export default async function LocalitiesPage() {
  const [localities, settings] = await Promise.all([listPublicLocalities(), getAllSiteSettings()]);
  if (settings.localities_enabled === "false") notFound();
  const byCity = localities.reduce((m, l) => ((m[l.city] ||= []).push(l), m), {});

  return (
    <>
      <Header />
      <main className="bg-sand-50">
        <PageHeader eyebrow="Know before you buy" title="Localities & price guides" subtitle="Average prices, rents and trends for every neighbourhood we cover, from real listings on our site." />
        <section className="container-page space-y-12 py-12">
          {localities.length === 0 ? (
            <EmptyState icon={MapPinned} title="Locality guides are coming soon" text="We're putting together price guides for each neighbourhood." primary={{ label: "Browse properties", href: "/properties" }} />
          ) : (
            Object.entries(byCity).map(([city, list]) => (
              <div key={city}>
                <h2 className="font-display text-2xl text-navy-900">{city}</h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {list.map((l) => <LocalityCard key={l.id} locality={l} symbol={settings.currency_symbol} unit="m²" />)}
                </div>
              </div>
            ))
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
