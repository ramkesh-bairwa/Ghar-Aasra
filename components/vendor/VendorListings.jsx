"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye, MessageSquare, CalendarCheck, Heart, Pencil, Trash2, ExternalLink, Loader2, MapPin, BedDouble,
  Bath, Ruler, Search, LayoutGrid, List, Video, Rotate3d, Lightbulb, Image as ImageIcon, Building2,
} from "lucide-react";
import { useDialog } from "@/components/ConfirmDialog";
import { LISTING_STATUS, formatPrice, formatDate, strengthTone, StrengthRing, timeAgo } from "./vendorShared";

const FILTERS = [
  { key: "all", label: "All", match: () => true },
  { key: "live", label: "Live", match: (p) => p.status === "published" },
  { key: "paused", label: "Paused", match: (p) => p.status === "draft" },
  { key: "under_offer", label: "Under offer", match: (p) => p.status === "under_offer" },
  { key: "closed", label: "Sold / Rented", match: (p) => p.status === "sold" || p.status === "rented" },
];

const isPublic = (p) => ["published", "under_offer"].includes(p.status);
const prettyType = (p) => p.subcategoryName || String(p.propertyType || "").replace(/_/g, " ");

function StatusSelect({ property, busy, onStatus, className = "" }) {
  return (
    <select
      value={property.status}
      disabled={busy}
      onChange={(e) => onStatus(property, e.target.value)}
      className={`rounded-xl bg-sand-50 px-3 py-2 text-sm font-medium text-navy-900 ring-1 ring-navy-900/10 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 ${className}`}
      aria-label="Listing status"
    >
      <option value="published">Live</option>
      <option value="under_offer">Under offer</option>
      <option value="draft">Paused (hidden)</option>
      <option value="sold">Sold</option>
      <option value="rented">Rented</option>
    </select>
  );
}

function DeleteButton({ property, busy, onDelete }) {
  const { confirm: ask, dialog } = useDialog();
  if (busy) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-xl text-navy-800/50 ring-1 ring-navy-900/10">
        <Loader2 size={15} className="animate-spin" />
      </span>
    );
  }
  async function confirmDelete() {
    const ok = await ask({
      title: "Delete this listing?",
      message: `"${property.title}" will be removed from the site along with its photos and floor plans. This cannot be undone.`,
      confirmLabel: "Delete listing",
    });
    if (ok) onDelete(property);
  }
  return (
    <>
      <button
        type="button"
        onClick={confirmDelete}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-navy-800/60 ring-1 ring-navy-900/10 transition-colors hover:bg-coral-500/10 hover:text-coral-600"
        title="Delete listing"
      >
        <Trash2 size={15} />
      </button>
      {dialog}
    </>
  );
}

function MediaBadges({ property }) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {property.hasVideo && (
        <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
          <Video size={11} /> Video
        </span>
      )}
      {property.hasVirtualTour && (
        <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
          <Rotate3d size={11} /> 360° tour
        </span>
      )}
      <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
        <ImageIcon size={11} /> {property.photoCount}
      </span>
    </div>
  );
}

function Specs({ property, className = "" }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-800/60 ${className}`}>
      {property.city && <span className="flex items-center gap-1"><MapPin size={12} /> {property.city}</span>}
      {property.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble size={12} /> {property.bedrooms} bd</span>}
      {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath size={12} /> {property.bathrooms} ba</span>}
      {property.areaSqm ? <span className="flex items-center gap-1"><Ruler size={12} /> {Number(property.areaSqm).toLocaleString()} m²</span> : null}
    </div>
  );
}

function Metrics({ property, compact = false }) {
  const items = [
    { Icon: Eye, value: property.views, label: "Views" },
    { Icon: MessageSquare, value: property.enquiries, label: "Enquiries" },
    { Icon: CalendarCheck, value: property.visits, label: "Visits" },
    { Icon: Heart, value: property.saves, label: "Saves" },
  ];
  return (
    <div className="grid grid-cols-4 divide-x divide-navy-900/5 rounded-xl bg-sand-50 ring-1 ring-navy-900/5">
      {items.map(({ Icon, value, label }) => (
        <div key={label} className={`text-center ${compact ? "px-1 py-1.5" : "px-1 py-2"}`}>
          <div className="flex items-center justify-center gap-1 text-sm font-semibold text-navy-900">
            <Icon size={12} className="text-teal-600" /> {Number(value || 0).toLocaleString()}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-navy-800/45">{label}</div>
        </div>
      ))}
    </div>
  );
}

function StrengthBar({ property }) {
  const tone = strengthTone(property.strength);
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-navy-900">Listing strength</span>
        <span className={`font-semibold ${tone.text}`}>{property.strength}% · {tone.label}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-navy-900/10">
        <div className={`h-full rounded-full ${tone.bar} transition-[width] duration-700`} style={{ width: `${property.strength}%` }} />
      </div>
      {property.tips?.[0] ? (
        <Link href={`/vendor/properties/${property.id}/edit`} className="mt-2 flex items-start gap-1.5 text-xs text-navy-800/65 hover:text-teal-700">
          <Lightbulb size={13} className="mt-px shrink-0 text-amber-500" />
          <span>{property.tips[0]}{property.tips.length > 1 ? ` (+${property.tips.length - 1} more)` : ""}</span>
        </Link>
      ) : (
        <div className="mt-2 text-xs font-medium text-teal-700">Fully optimised — great work!</div>
      )}
    </div>
  );
}

function GridCard({ property, symbol, busy, onStatus, onDelete }) {
  const status = LISTING_STATUS[property.status] || LISTING_STATUS.draft;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy-900/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
      <div className="relative h-48 overflow-hidden bg-sand-100">
        {property.image ? (
          <img src={property.image} alt={property.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-navy-800/30"><Building2 size={40} /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/10 to-transparent" />
        <span className={`absolute left-0 top-4 rounded-r-full py-1 pl-3 pr-3.5 text-[11px] font-bold uppercase tracking-wider shadow-card ${status.ribbon}`}>
          {status.label}
        </span>
        <div className="absolute right-3 top-3"><MediaBadges property={property} /></div>
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2 text-white">
          <div className="font-display text-2xl leading-none drop-shadow">{formatPrice(property, symbol)}</div>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold capitalize backdrop-blur">
            {property.listingType === "rent" ? "For rent" : property.listingType === "commercial" ? "Commercial" : "For sale"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 font-display text-lg text-navy-900" title={property.title}>{property.title}</h3>
          <div className="mt-0.5 text-xs capitalize text-navy-800/50">{prettyType(property)} · updated {timeAgo(property.updatedAt || property.createdAt)}</div>
          <Specs property={property} className="mt-1.5" />
        </div>
        <Metrics property={property} />
        <StrengthBar property={property} />
        <div className="mt-auto flex items-center gap-2 border-t border-navy-900/5 pt-3">
          <StatusSelect property={property} busy={busy} onStatus={onStatus} className="min-w-0 flex-1" />
          <Link href={`/vendor/properties/${property.id}/edit`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white hover:bg-navy-950" title="Edit listing">
            <Pencil size={14} />
          </Link>
          {isPublic(property) && (
            <a href={`/properties/${property.slug}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl text-navy-800/60 ring-1 ring-navy-900/10 hover:text-teal-600" title="View live listing">
              <ExternalLink size={15} />
            </a>
          )}
          <DeleteButton property={property} busy={busy} onDelete={onDelete} />
        </div>
      </div>
    </article>
  );
}

function ListRow({ property, symbol, busy, onStatus, onDelete }) {
  const status = LISTING_STATUS[property.status] || LISTING_STATUS.draft;
  const tone = strengthTone(property.strength);
  return (
    <article className="group flex flex-col gap-4 rounded-2xl bg-white p-3 shadow-soft ring-1 ring-navy-900/5 transition-shadow hover:shadow-card lg:flex-row lg:items-center">
      <div className="relative h-44 shrink-0 overflow-hidden rounded-xl bg-sand-100 lg:h-32 lg:w-52">
        {property.image ? (
          <img src={property.image} alt={property.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-navy-800/30"><Building2 size={32} /></div>
        )}
        <span className={`absolute left-0 top-3 rounded-r-full py-0.5 pl-2.5 pr-3 text-[10px] font-bold uppercase tracking-wider ${status.ribbon}`}>{status.label}</span>
        <div className="absolute bottom-2 right-2"><MediaBadges property={property} /></div>
      </div>

      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg text-navy-900">{property.title}</h3>
            <Specs property={property} />
          </div>
          <div className="text-right">
            <div className="font-display text-xl text-navy-900">{formatPrice(property, symbol)}</div>
            <div className="text-[11px] capitalize text-navy-800/45">{prettyType(property)} · listed {formatDate(property.createdAt)}</div>
          </div>
        </div>
        <Metrics property={property} compact />
      </div>

      <div className="flex shrink-0 items-center gap-3 lg:w-60 lg:flex-col lg:items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
          <StrengthRing score={property.strength} size={44} stroke={5} />
          <div className="min-w-0 text-xs">
            <div className={`font-semibold ${tone.text}`}>{tone.label}</div>
            <div className="truncate text-navy-800/55">{property.tips?.[0] || "Fully optimised"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusSelect property={property} busy={busy} onStatus={onStatus} className="min-w-0 flex-1" />
          <Link href={`/vendor/properties/${property.id}/edit`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white hover:bg-navy-950" title="Edit listing">
            <Pencil size={14} />
          </Link>
          {isPublic(property) && (
            <a href={`/properties/${property.slug}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl text-navy-800/60 ring-1 ring-navy-900/10 hover:text-teal-600" title="View live listing">
              <ExternalLink size={15} />
            </a>
          )}
          <DeleteButton property={property} busy={busy} onDelete={onDelete} />
        </div>
      </div>
    </article>
  );
}

export default function VendorListings({ properties, symbol, busyId, onStatus, onDelete }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, properties.filter(f.match).length])),
    [properties]
  );

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter) || FILTERS[0];
    const q = search.trim().toLowerCase();
    return properties.filter((p) => f.match(p) && (!q || String(p.title).toLowerCase().includes(q) || String(p.city || "").toLowerCase().includes(q)));
  }, [properties, filter, search]);

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-colors ${
                filter === f.key ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-navy-800/70 ring-navy-900/10 hover:ring-teal-500"
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 text-[11px] ${filter === f.key ? "bg-white/20" : "bg-navy-900/5"}`}>{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="relative flex-1 lg:w-64 lg:flex-none">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your listings"
              className="w-full rounded-full bg-white py-2 pl-9 pr-3 text-sm text-navy-900 ring-1 ring-navy-900/10 placeholder:text-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </label>
          <div className="flex rounded-full bg-white p-1 ring-1 ring-navy-900/10">
            {[{ key: "grid", Icon: LayoutGrid }, { key: "list", Icon: List }].map(({ key, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`flex h-7 w-8 items-center justify-center rounded-full transition-colors ${view === key ? "bg-navy-900 text-white" : "text-navy-800/50 hover:text-navy-900"}`}
                aria-label={`${key} view`}
                aria-pressed={view === key}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        {visible.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-navy-800/55 shadow-soft ring-1 ring-navy-900/5">
            No listings match {search ? <>&ldquo;{search}&rdquo;</> : "this filter"}.
            <button type="button" onClick={() => { setFilter("all"); setSearch(""); }} className="ml-1 font-semibold text-teal-600 hover:text-teal-700">Clear filters</button>
          </div>
        ) : view === "grid" ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((p) => (
              <GridCard key={p.id} property={p} symbol={symbol} busy={busyId === p.id} onStatus={onStatus} onDelete={onDelete} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((p) => (
              <ListRow key={p.id} property={p} symbol={symbol} busy={busyId === p.id} onStatus={onStatus} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
