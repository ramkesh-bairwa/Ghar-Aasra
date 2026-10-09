"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, CalendarCheck, MapPin } from "lucide-react";

const KEY = "fh_recently_viewed";
const VIEWED_KEY = "fh_viewed_slugs";
const MAX = 8;

function read(key, storage) {
  try {
    return JSON.parse(storage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function write(key, storage, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked — feature just stays empty */
  }
}

// Records this property in the visitor's browsing history (localStorage, this
// browser only), counts one view per session for the public view counter,
// and shows the other properties they looked at, each with a Book-visit
// shortcut, since comparing a few listings is usually the step before booking.
export default function RecentlyViewed({ property }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const entry = { slug: property.slug, title: property.title, image: property.image, price: property.price, city: property.city };
    const list = read(KEY, localStorage).filter((p) => p.slug !== property.slug);
    setItems(list.slice(0, 4));
    write(KEY, localStorage, [entry, ...list].slice(0, MAX));

    const viewed = read(VIEWED_KEY, sessionStorage);
    if (!viewed.includes(property.slug)) {
      write(VIEWED_KEY, sessionStorage, [...viewed, property.slug]);
      fetch(`/api/properties/${encodeURIComponent(property.slug)}/view`, { method: "POST" }).catch(() => {});
    }
  }, [property.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!items.length) return null;

  return (
    <section className="border-t border-navy-900/8 bg-sand-50 py-12 print:hidden">
      <div className="container-page">
        <h2 className="flex items-center gap-2 font-display text-2xl text-navy-900">
          <History size={22} className="text-teal-600" /> Recently viewed
        </h2>
        <p className="mt-1 text-sm text-navy-800/55">Still thinking about these? Seeing them in person makes the choice easier.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <div key={p.slug} className="card-surface overflow-hidden">
              <Link href={`/properties/${p.slug}`} className="block">
                <img src={p.image} alt={p.title} className="h-36 w-full object-cover" />
                <div className="p-4 pb-2">
                  <div className="truncate font-display text-base text-navy-900">{p.title}</div>
                  <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-navy-800/55">
                    <span className="flex min-w-0 items-center gap-1 truncate"><MapPin size={11} /> {p.city}</span>
                    <span className="shrink-0 font-semibold text-navy-900">{p.price}</span>
                  </div>
                </div>
              </Link>
              <div className="px-4 pb-4">
                <Link
                  href={`/properties/${p.slug}/visit`}
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-full border border-teal-500/40 px-3 py-2 text-xs font-semibold text-teal-600 hover:bg-teal-500 hover:text-white"
                >
                  <CalendarCheck size={13} /> Book visit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
