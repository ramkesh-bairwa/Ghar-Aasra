import { Star } from "lucide-react";
import { listTestimonials } from "@/lib/queries";

export default async function Testimonials({ title, subtitle }) {
  const testimonials = await listTestimonials();
  if (!testimonials.length) return null;

  return (
    <section className="bg-white py-16">
      <div className="container-page">
        <h2 className="font-display text-2xl text-navy-900 md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-[15px] text-navy-800/60">{subtitle}</p>}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.id} className="rounded-xl2 border border-navy-900/8 bg-sand-50 p-6">
              <div className="flex gap-0.5 text-coral-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={15} fill={i < t.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                ))}
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-navy-800/75">"{t.quote}"</p>
              <div className="mt-5 border-t border-navy-900/8 pt-4">
                <div className="text-sm font-semibold text-navy-900">{t.name}</div>
                <div className="text-xs text-navy-800/50">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
