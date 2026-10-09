import Link from "next/link";
import { MapPin, Building2, ArrowRight } from "lucide-react";

export default function LocalityCard({ locality, symbol, unit }) {
  const money = (n) => `${symbol}${Math.round(n).toLocaleString("en-IN")}`;
  return (
    <Link href={`/localities/${locality.slug}`} className="card-surface group block overflow-hidden transition-shadow hover:shadow-card">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-navy-900 to-teal-600">
        {locality.coverImage && <img src={locality.coverImage} alt={locality.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="font-display text-xl">{locality.name}</div>
          <div className="flex items-center gap-1 text-xs text-white/70"><MapPin size={12} /> {locality.city}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-4 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-navy-800/45">Avg price</div>
          <div className="font-semibold text-navy-900">{locality.avgSaleRate ? `${money(locality.avgSaleRate)}/${unit}` : "—"}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-navy-800/45">Avg rent</div>
          <div className="font-semibold text-navy-900">{locality.avgRent ? `${money(locality.avgRent)}/mo` : "—"}</div>
        </div>
        <div className="col-span-2 flex items-center justify-between border-t border-navy-900/8 pt-2 text-xs text-navy-800/55">
          <span className="flex items-center gap-1"><Building2 size={12} /> {locality.listings} {locality.listings === 1 ? "listing" : "listings"}</span>
          <span className="flex items-center gap-1 font-semibold text-teal-600">Price guide <ArrowRight size={12} /></span>
        </div>
      </div>
    </Link>
  );
}
