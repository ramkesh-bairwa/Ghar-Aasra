import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { listProjects, listDevelopers, listLocations } from "@/lib/queries";
import { MapPin, Building } from "lucide-react";

export const metadata = { title: "New Projects" };

export default async function ProjectsPage() {
  const [projects, developers, locations] = await Promise.all([listProjects(), listDevelopers(), listLocations()]);
  const statusLabel = { presale: "Presale", under_construction: "Under construction", selling: "Selling now", completed: "Completed" };

  return (
    <>
      <Header />
      <main>
        <PageHeader eyebrow="New Projects" title="Developments open right now" subtitle="Presale, under construction, and newly completed — direct from the developer." />
        <section className="bg-sand-50 py-12">
          <div className="container-page grid gap-6 lg:grid-cols-3">
            {projects.map((p) => {
              const dev = developers.find((d) => d.id === p.developerId);
              const loc = locations.find((l) => l.id === p.locationId);
              return (
                <a key={p.slug} href={`/projects/${p.slug}`} className="card-surface group block overflow-hidden">
                  <div className="relative">
                    <img src={p.image} alt={p.name} className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <span className="badge-pill absolute left-3 top-3 bg-white/90 text-navy-800">{statusLabel[p.status] || p.status}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg text-navy-900">{p.name}</h3>
                    {dev && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-navy-800/55">
                        <Building size={13} /> {dev.companyName}
                      </p>
                    )}
                    {loc && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-navy-800/55">
                        <MapPin size={13} /> {loc.city}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between border-t border-navy-900/8 pt-3 text-sm">
                      <span className="text-navy-800/60">From</span>
                      <span className="font-semibold text-navy-900">{p.startingPrice}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
