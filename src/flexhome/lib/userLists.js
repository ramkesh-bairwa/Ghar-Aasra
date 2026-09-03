"use client";

// Client-only favorites/compare state, persisted to localStorage so the
// lists survive reloads without needing a logged-in user or a DB table.
// Every page reads/writes through this one provider so the floating dock
// badges, PropertyCard buttons, and the /favorites and /compare pages
// all stay in sync.

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const FAVORITES_KEY = "flexhome_favorites";
const COMPARE_KEY = "flexhome_compare";
export const COMPARE_LIMIT = 4;

const UserListsContext = createContext(null);

function readList(key) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function UserListsProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [compare, setCompare] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavorites(readList(FAVORITES_KEY));
    setCompare(readList(COMPARE_KEY));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(COMPARE_KEY, JSON.stringify(compare));
  }, [compare, hydrated]);

  const toggleFavorite = useCallback((slug) => {
    setFavorites((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }, []);

  const toggleCompare = useCallback((slug) => {
    setCompare((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= COMPARE_LIMIT) return prev;
      return [...prev, slug];
    });
  }, []);

  const removeFromCompare = useCallback((slug) => {
    setCompare((prev) => prev.filter((s) => s !== slug));
  }, []);

  const clearCompare = useCallback(() => setCompare([]), []);

  return (
    <UserListsContext.Provider
      value={{
        favorites,
        compare,
        hydrated,
        toggleFavorite,
        toggleCompare,
        removeFromCompare,
        clearCompare,
        isFavorite: (slug) => favorites.includes(slug),
        isComparing: (slug) => compare.includes(slug),
        compareLimit: COMPARE_LIMIT,
      }}
    >
      {children}
    </UserListsContext.Provider>
  );
}

export function useUserLists() {
  const ctx = useContext(UserListsContext);
  if (!ctx) throw new Error("useUserLists must be used within UserListsProvider");
  return ctx;
}
