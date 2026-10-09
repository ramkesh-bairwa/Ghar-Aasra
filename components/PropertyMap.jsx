"use client";

import dynamic from "next/dynamic";

// react-leaflet touches `window` at import time, so it can only load on
// the client — ssr:false is only permitted inside a Client Component,
// which is why this thin wrapper exists instead of dynamic-importing
// PropertyMapInner directly from the (server) page.
const PropertyMapInner = dynamic(() => import("@/components/PropertyMapInner"), {
  ssr: false,
  loading: () => (
    <section className="bg-sand-50 py-10">
      <div className="container-page">
        <div className="grid gap-4 lg:grid-cols-[340px,1fr]">
          <div className="card-surface h-[420px] animate-pulse lg:h-[560px]" />
          <div className="h-[420px] animate-pulse rounded-xl2 bg-white lg:h-[560px]" />
        </div>
      </div>
    </section>
  ),
});

export default function PropertyMap() {
  return <PropertyMapInner />;
}
