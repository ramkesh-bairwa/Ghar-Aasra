import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import TrendChart from "@/components/localities/TrendChart";
import { getLocalityBySlug, getLocalityStats } from "@/lib/localities";
import { getAllSiteSettings, listProperties } from "@/lib/queries";
import { MapPin, TrendingUp, Home, KeyRound, CheckCircle2, Navigation, ShieldCheck, Train, Sparkles, BellPlus, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const l = await getLocalityBySlug(params.slug);
  return { title: l ? `${l.name}, ${l.city} — Prices & Guide` : "Locality", description: l?.description?.slice(0, 160) };
}

const SCORE_META = [
  { key: "connectivity", label: "Connectivity", Icon: Train },
  { key: "safety", label: "Safety", Icon: ShieldCheck },
  { key: "lifestyle", label: "Lifestyle", Icon: Sparkles },
];

export default async function LocalityPage({ params }) {
  const [locality, settings] = await Promise.all([getLocalityBySlug(params.slug), getAllSiteSettings()]);
  if (!locality || settings.localities_enabled === "false") notFound();
  const [stats, properties] = await Promise.all([
    getLocalityStats(locality.locationId, locality.name),
    listProperties({ city: locality.city, locality: locality.name, sponsoredFirst: true, limit: 9 }),
  ]);
  const symbol = settings.currency_symbol;
  const money = (n) => (n == null ? "—" : `${symbol}${Math.round(n).toLocaleString("en-IN")}`);
  const vsCity = stats.avgSaleRate && stats.cityAvgSaleRate ? Math.round(((stats.avgSaleRate - stats.cityAvgSaleRate) / stats.cityAvgSaleRate) * 100) : null;
  const scores = SCORE_META.filter((s) => locality.scores[s.key]);
  const alertHref = `/buy?city=${encodeURIComponent(locality.city)}&locality=${encodeURIComponent(locality.name)}`;

  const tiles = [
    { Icon: Home, label: "Avg sale price / m²", value: stats.avgSaleRate ? money(stats.avgSaleRate) : "—", sub: vsCity == null ? null : `${Math.abs(vsCity)}% ${vsCity <= 0 ? "below" : "above"} ${locality.city} average` },
    { Icon: KeyRound, label: "Avg monthly rent", value: money(stats.avgRent), sub: stats.minRent ? `${money(stats.minRent)} – ${money(stats.maxRent)}` : null },
    { Icon: TrendingUp, label: "Sale price range", value: stats.minSale ? `${money(stats.minSale)} – ${money(stats.maxSale)}` : "—", sub: `${stats.saleCount} for sale` },
    { Icon: MapPin, label: "Live listings", value: String(stats.saleCount + stats.rentCount), sub: `${stats.rentCount} for rent` },
  ];

  return (
    <>
      <Header />
      <main className="bg-sand-50">
        <section className="relative overflow-hidden bg-navy-900 pb-24 pt-14 text-white">
          {locality.coverImage && <img src={locality.coverImage} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-35" />}
          <div className="absolute inset-0 bg-gradient-to-br from-navy-950/95 via-navy-900/80 to-navy-900/50" />
          <div className="container-page relative">
            <Link href="/localities" className="text-sm text-teal-300 hover:underline">← All localities</Link>
            <h1 className="mt-3 font-display text-4xl md:text-5xl">{locality.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-white/70"><MapPin size={16} /> {locality.city}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={alertHref} className="btn-primary"><Home size={16} /> Homes in {locality.name}</Link>
              <Link href={alertHref} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/15">
                <BellPlus size={16} /> Get alerts for this area
              </Link>
            </div>
          </div>
        </section>

        <section className="container-page relative z-10 -mt-14">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map(({ Icon, label, value, sub }) => (
              <div key={label} className="card-surface p-5">
                <Icon size={18} className="text-teal-600" />
                <div className="mt-2 text-xs text-navy-800/55">{label}</div>
                <div className="font-display text-2xl text-navy-900">{value}</div>
                {sub && <div className="text-xs text-navy-800/50">{sub}</div>}
              </div>
            ))}
          </div>
        </section>

        <section className="container-page grid gap-8 py-12 lg:grid-cols-[1.6fr,1fr]">
          <div className="space-y-6">
            {locality.description && (
              <div className="card-surface p-6">
                <h2 className="font-display text-xl text-navy-900">About {locality.name}</h2>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-navy-800/75">{locality.description}</p>
              </div>
            )}
            <div className="card-surface p-6">
              <h2 className="font-display text-xl text-navy-900">Average sale price per m², last 12 months</h2>
              <p className="mt-1 text-sm text-navy-800/55">By the month homes were listed on our site.</p>
              <div className="mt-5">
                {stats.trend.length >= 2 ? (
                  <TrendChart points={stats.trend} symbol={symbol} unit="m²" />
                ) : (
                  <p className="rounded-xl bg-sand-100 p-4 text-sm text-navy-800/60">Not enough listings yet to show a trend. Check back soon.</p>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            {scores.length > 0 && (
              <div className="card-surface p-6">
                <h2 className="font-display text-lg text-navy-900">Locality scores</h2>
                <div className="mt-4 space-y-3">
                  {scores.map(({ key, label, Icon }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-navy-800/70"><Icon size={15} className="text-teal-600" /> {label}</span>
                        <span className="font-semibold text-navy-900">{locality.scores[key]}/10</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-navy-900/8"><div className="h-2 rounded-full bg-teal-500" style={{ width: `${locality.scores[key] * 10}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {locality.highlights.length > 0 && (
              <div className="card-surface p-6">
                <h2 className="font-display text-lg text-navy-900">Why people like it</h2>
                <ul className="mt-3 space-y-2">
                  {locality.highlights.map((h) => <li key={h} className="flex gap-2 text-sm text-navy-800/75"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-teal-600" /> {h}</li>)}
                </ul>
              </div>
            )}
            {locality.nearby.length > 0 && (
              <div className="card-surface p-6">
                <h2 className="font-display text-lg text-navy-900">What's nearby</h2>
                <ul className="mt-3 space-y-2">
                  {locality.nearby.map((n) => <li key={n} className="flex gap-2 text-sm text-navy-800/75"><Navigation size={15} className="mt-0.5 shrink-0 text-teal-600" /> {n}</li>)}
                </ul>
              </div>
            )}
          </aside>
        </section>

        <section className="container-page pb-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-2xl text-navy-900">Homes in {locality.name}</h2>
            <Link href={alertHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:underline">See all <ArrowRight size={14} /></Link>
          </div>
          {properties.length ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{properties.map((p) => <PropertyCard key={p.slug} property={p} />)}</div>
          ) : (
            <p className="mt-4 rounded-xl bg-white p-6 text-sm text-navy-800/60 shadow-soft">No homes listed here right now. <Link href={alertHref} className="font-semibold text-teal-600">Save a search</Link> to get alerted when one is.</p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
