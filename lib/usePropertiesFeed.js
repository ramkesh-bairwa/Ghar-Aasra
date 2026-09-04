"use client";

import { useEffect, useState } from "react";

// Shared client-side fetch of the full property list for pages (favorites,
// compare, map) that filter/plot against localStorage state and can't use
// the server-only lib/queries functions directly.
export function usePropertiesFeed() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/properties")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setProperties(data.properties || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { properties, loading };
}
