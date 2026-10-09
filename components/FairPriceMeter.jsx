import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Scale, MapPinned } from "lucide-react";

const VERDICT = {
  great: { label: "Great deal", cls: "bg-teal-500 text-white", text: "text-teal-600" },
  good: { label: "Good price", cls: "bg-teal-500/15 text-teal-700", text: "text-teal-600" },
  fair: { label: "Fair price", cls: "bg-navy-900/10 text-navy-800", text: "text-navy-800" },
  above: { label: "Above market", cls: "bg-amber-500/15 text-amber-700", text: "text-amber-700" },
  premium: { label: "Premium priced", cls: "bg-coral-500/10 text-coral-600", text: "text-coral-600" },
};

// Price-per-area comparison with similar listings in the same locality
// (or the city when the locality has too few). See lib/localities getFairPrice.
export default function FairPriceMeter({ insight, symbol, unit }) {
  if (!insight) return null;
  const v = VERDICT[insight.verdict] || VERDICT.fair;
  const money = (n) => `${symbol}${Math.round(n).toLocaleString("en-IN")}`;
  // Marker on a scale of the cheapest → priciest comparable (clamped).
  const span = Math.max(insight.maxRate - insight.minRate, 1);
  const pos = Math.min(Math.max(((insight.rate - insight.minRate) / span) * 100, 3), 97);
  const avgPos = Math.min(Math.max(((insight.avgRate - insight.minRate) / span) * 100, 3), 97);
  const where = insight.scope === "locality" ? insight.label : `${insight.label} (city-wide)`;

  return (
    <div className="mt-5 rounded-xl2 bg-sand-100 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Scale size={17} className="text-teal-600" />
          <span className="text-sm font-semibold text-navy-900">Fair price meter</span>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${v.cls}`}>{v.label}</span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-sm">
        {insight.diffPercent <= 0 ? <ArrowDownRight size={17} className="text-teal-600" /> : <ArrowUpRight size={17} className={v.text} />}
        <span className="text-navy-800/75">
          {insight.diffPercent === 0 ? (
            <>Priced right at the average for <b className="text-navy-900">{where}</b></>
          ) : (
            <>
              <b className={v.text}>{Math.abs(insight.diffPercent)}% {insight.diffPercent < 0 ? "below" : "above"}</b> the average for <b className="text-navy-900">{where}</b>
            </>
          )}
        </span>
      </div>

      <div className="relative mt-6 h-2.5 rounded-full bg-gradient-to-r from-teal-500 via-amber-400 to-coral-500">
        <span className="absolute -top-5 -translate-x-1/2 text-[10px] font-semibold text-navy-800/50" style={{ left: `${avgPos}%` }}>avg</span>
        <span className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-navy-900/40" style={{ left: `${avgPos}%` }} />
        <span
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-navy-900 shadow-card"
          style={{ left: `${pos}%` }}
          title={`This listing: ${money(insight.rate)}/${unit}`}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-navy-800/55">
        <span>{money(insight.minRate)}/{unit}</span>
        <span className="font-semibold text-navy-900">This home: {money(insight.rate)}/{unit}</span>
        <span>{money(insight.maxRate)}/{unit}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-navy-900/8 pt-3 text-[11px] text-navy-800/50">
        <span>Based on {insight.comparables} similar listings on our site, by price per {unit}. Average {money(insight.avgRate)}/{unit}.</span>
        {insight.localitySlug && (
          <Link href={`/localities/${insight.localitySlug}`} className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:underline">
            <MapPinned size={12} /> {insight.label} price guide
          </Link>
        )}
      </div>
    </div>
  );
}
