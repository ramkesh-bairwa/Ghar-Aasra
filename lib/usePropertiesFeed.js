"use client";

import { useEffect, useState } from "react";

// Shared client-side fetch of the full property list for pages (favorites,
// compare, map) that filter/plot against localStorage state and can't use
// the server-only lib/queries functions directly. One request is shared by
// every caller for a short while (the floating dock's counters and the page
// itself both need it on load).
const CACHE_MS = 30000;
let cached = null; // { at, promise }

export function loadPropertiesFeed() {
  if (!cached || Date.now() - cached.at > CACHE_MS) {
    const promise = fetch("/api/properties")
      .then((res) => (res.ok ? res.json() : { properties: [] }))
      .then((data) => data.properties || [])
      .catch(() => {
        cached = null; // don't keep a failed request around
        return [];
      });
    cached = { at: Date.now(), promise };
  }
  return cached.promise;
}

export function usePropertiesFeed() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadPropertiesFeed()
      .then((list) => {
        if (!cancelled) setProperties(list);
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
