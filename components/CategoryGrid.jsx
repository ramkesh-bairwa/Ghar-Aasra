import { Building2, Home, Warehouse, Trees, Store, Briefcase } from "lucide-react";
import { categories } from "@/lib/data";

const icons = { "building-2": Building2, home: Home, warehouse: Warehouse, trees: Trees, store: Store, briefcase: Briefcase };

export default function CategoryGrid() {
  return (
    <section className="bg-sand-50 py-14">
      <div className="container-page">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl text-navy-900 md:text-3xl">Browse by property type</h2>
            <p className="mt-1 text-[15px] text-navy-800/60">Jump straight to the kind of place you're picturing.</p>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => {
            const Icon = icons[c.icon];
            return (
              <a
                key={c.name}
                href={`/properties?propertyType=${c.slug}`}
                className="card-surface flex flex-col items-center gap-3 px-4 py-7 text-center transition-shadow hover:shadow-card"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
                  <Icon size={20} />
                </span>
                <span className="text-sm font-semibold text-navy-900">{c.name}</span>
                <span className="text-xs text-navy-800/50">{c.count} listings</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
