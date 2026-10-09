export default function LocationsGrid({ locations = [], title, subtitle }) {
  return (
    <section className="bg-white py-16">
      <div className="container-page">
        <h2 className="font-display text-2xl text-navy-900 md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-[15px] text-navy-800/60">{subtitle}</p>}

        <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-5">
          {locations.map((l) => (
            <a
              key={l.city}
              href={`/locations/${l.slug}`}
              className="group relative h-40 overflow-hidden rounded-xl2 md:h-48"
            >
              <img
                src={l.image}
                alt={l.city}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="font-display text-[15px] text-white">{l.city}</div>
                <div className="text-xs text-white/70">{l.propertiesCount || "—"} listings</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
