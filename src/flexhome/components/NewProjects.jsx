import { MapPin, Building } from "lucide-react";

const statusLabel = { presale: "Presale", under_construction: "Under construction", selling: "Selling now", completed: "Completed" };

export default function NewProjects({ projects = [], developers = [], locations = [] }) {
  return (
    <section className="bg-sand-50 py-16">
      <div className="container-page">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl text-navy-900 md:text-3xl">New projects</h2>
            <p className="mt-1 text-[15px] text-navy-800/60">Developments open for presale or under construction.</p>
          </div>
          <a href="/projects" className="hidden text-sm font-semibold text-teal-600 hover:text-teal-700 sm:block">
            View all projects
          </a>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {projects.map((p) => {
            const dev = developers.find((d) => d.id === p.developerId);
            const loc = locations.find((l) => l.id === p.locationId);
            return (
              <a key={p.slug} href={`/projects/${p.slug}`} className="card-surface group block overflow-hidden">
                <div className="relative">
                  <img src={p.image} alt={p.name} className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <span className="badge-pill absolute left-3 top-3 bg-white/90 text-navy-800">{statusLabel[p.status] || p.status}</span>
                </div>
                <div className="p-4">
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
                  <div className="mt-3 border-t border-navy-900/8 pt-3 text-sm text-navy-800/70">
                    Handover: <span className="font-medium text-navy-900">{p.handover}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
