import { Mail, Phone, Home as HomeIcon, Star } from "lucide-react";

export default function FeaturedAgents({ agents = [] }) {
  return (
    <section className="bg-white py-16">
      <div className="container-page">
        <h2 className="font-display text-2xl text-navy-900 md:text-3xl">Featured agents</h2>
        <p className="mt-1 text-[15px] text-navy-800/60">Licensed, reviewed, and quick to reply.</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((a) => (
            <div key={a.slug} className="card-surface overflow-hidden">
              <img src={a.image} alt={a.name} className="h-52 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-display text-[17px] text-navy-900">{a.name}</h3>
                {a.rating != null && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-coral-600">
                    <Star size={12} fill="currentColor" /> {a.rating} ({a.reviewCount})
                  </div>
                )}
                <p className="mt-2 flex items-center gap-1.5 text-sm text-navy-800/60">
                  <Phone size={13} /> {a.phone}
                </p>
                <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-navy-800/60">
                  <Mail size={13} /> {a.email}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-navy-900/8 pt-3">
                  <span className="flex items-center gap-1.5 text-sm text-navy-800/70">
                    <HomeIcon size={14} /> {a.propertiesCount} properties
                  </span>
                  <a href={`/agents/${a.slug}`} className="btn-outline px-4 py-1.5 text-xs">
                    View
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
