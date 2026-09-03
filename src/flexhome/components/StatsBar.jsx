import { stats } from "@/lib/data";

export default function StatsBar() {
  return (
    <section className="bg-sand-50 pt-28 md:pt-32">
      <div className="container-page grid grid-cols-2 gap-6 border-b border-navy-900/8 pb-14 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="font-display text-3xl text-navy-900">{s.value}</div>
            <div className="mt-1 text-sm text-navy-800/60">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
