"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import PropertyCard from "./PropertyCard";

export default function FeaturedProperties({ saleProperties = [], rentProperties = [], title = "Featured properties", subtitle = "Hand-picked listings updated daily.", showModeToggle = true }) {
  const [mode, setMode] = useState("sale");
  const list = mode === "sale" ? saleProperties : rentProperties;

  return (
    <section className="bg-white py-16">
      <div className="container-page">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl text-navy-900 md:text-3xl">{title}</h2>
            <p className="mt-1 text-[15px] text-navy-800/60">{subtitle}</p>
          </div>

          {showModeToggle && <div className="flex gap-2 rounded-full bg-sand-100 p-1">
            <button
              onClick={() => setMode("sale")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                mode === "sale" ? "bg-navy-900 text-white" : "text-navy-800/60"
              }`}
            >
              For Sale
            </button>
            <button
              onClick={() => setMode("rent")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                mode === "rent" ? "bg-navy-900 text-white" : "text-navy-800/60"
              }`}
            >
              For Rent
            </button>
          </div>}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>

        {showModeToggle && <div className="mt-9 flex justify-center">
          <a href={mode === "sale" ? "/buy" : "/rent"} className="btn-outline">
            View all {mode === "sale" ? "properties for sale" : "properties for rent"}
            <ArrowRight size={16} />
          </a>
        </div>}
      </div>
    </section>
  );
}
