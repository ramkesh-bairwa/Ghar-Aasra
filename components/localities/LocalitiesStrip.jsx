import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listPublicLocalities } from "@/lib/localities";
import { getAllSiteSettings } from "@/lib/queries";
import LocalityCard from "./LocalityCard";

export default async function LocalitiesStrip({ title, subtitle }) {
  const [localities, settings] = await Promise.all([listPublicLocalities({ limit: 8 }), getAllSiteSettings()]);
  if (settings.localities_enabled === "false" || !localities.length) return null;
  return (
    <section className="bg-sand-50 py-16">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-navy-900 md:text-3xl">{title}</h2>
            {subtitle && <p className="mt-1 text-[15px] text-navy-800/60">{subtitle}</p>}
          </div>
          <Link href="/localities" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:underline">All localities <ArrowRight size={15} /></Link>
        </div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {localities.slice(0, 4).map((l) => <LocalityCard key={l.id} locality={l} symbol={settings.currency_symbol} unit="m²" />)}
        </div>
      </div>
    </section>
  );
}
