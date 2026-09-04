"use client";

import dynamic from "next/dynamic";

// react-leaflet touches `window` at import time, so it can only load on
// the client — ssr:false is only permitted inside a Client Component,
// which is why this thin wrapper exists instead of dynamic-importing
// PropertyMiniMapInner directly from the (server) property detail page.
const PropertyMiniMapInner = dynamic(() => import("@/components/PropertyMiniMapInner"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-sand-100" />,
});

export default function PropertyMiniMap(props) {
  return <PropertyMiniMapInner {...props} />;
}
