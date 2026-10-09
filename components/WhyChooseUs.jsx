import { ShieldCheck, Users, FileCheck2, Headphones } from "lucide-react";

const ICONS = [ShieldCheck, Users, FileCheck2, Headphones];

export default function WhyChooseUs({ title, subtitle, items = [] }) {
  return (
    <section className="bg-sand-50 py-16">
      <div className="container-page">
        <h2 className="max-w-md font-display text-2xl text-navy-900 md:text-3xl">
          {title}
        </h2>
        {subtitle && <p className="mt-2 max-w-xl text-[15px] text-navy-800/60">{subtitle}</p>}

        <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ title, body }, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <div key={title} className="rounded-xl2 border border-navy-900/8 bg-white p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 text-teal-400">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-navy-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-800/60">{body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
