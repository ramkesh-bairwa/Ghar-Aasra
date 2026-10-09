"use client";

// Client-only favorites/compare state, persisted to localStorage so the
// lists survive reloads without a DB table. Every page reads/writes through
// this one provider so the floating dock badges, PropertyCard buttons, and
// the /favorites and /compare pages all stay in sync.
//
// Lists are stored per signed-in user (saving needs an account), so a second
// person signing in on the same browser doesn't inherit someone else's
// shortlist, and nothing is shown while signed out. Slugs of listings that
// are no longer live (deleted, unpublished, renamed) are pruned, so the dock
// counters always match what the Favorites / Compare pages can show.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { loadPropertiesFeed } from "@/lib/usePropertiesFeed";

const FAVORITES_KEY = "flexhome_favorites";
const COMPARE_KEY = "flexhome_compare";
export const COMPARE_LIMIT = 4;

const UserListsContext = createContext(null);

function readList(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* storage blocked — the list just won't persist */
  }
}

// The user's own list; on their first visit after this change, adopt the
// old browser-wide list (from before lists were per user) and retire it.
function readUserList(baseKey, userId) {
  const own = readList(`${baseKey}_${userId}`);
  if (own !== null) return own;
  const legacy = readList(baseKey);
  if (legacy !== null) {
    try {
      window.localStorage.removeItem(baseKey);
    } catch {
      /* ignore */
    }
    return legacy;
  }
  return [];
}

export function UserListsProvider({ children }) {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;
  const [favorites, setFavorites] = useState([]);
  const [compare, setCompare] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [owner, setOwner] = useState(null); // which user the in-memory lists belong to

  // Load the signed-in user's lists (or nothing when signed out), then drop
  // any slug that isn't a live listing anymore.
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    setHydrated(false);
    if (!userId) {
      setFavorites([]);
      setCompare([]);
      setOwner(null);
      setHydrated(true);
      return;
    }
    const favs = readUserList(FAVORITES_KEY, userId);
    const cmp = readUserList(COMPARE_KEY, userId).slice(0, COMPARE_LIMIT);
    setFavorites(favs);
    setCompare(cmp);
    setOwner(userId);
    setHydrated(true);

    loadPropertiesFeed().then((properties) => {
      // An empty feed usually means the DB is unreachable, not that every
      // listing is gone — keep the lists rather than wiping them.
      if (cancelled || !properties.length) return;
      const live = new Set(properties.map((p) => p.slug));
      setFavorites((prev) => prev.filter((s) => live.has(s)));
      setCompare((prev) => prev.filter((s) => live.has(s)));
    });
    return () => {
      cancelled = true;
    };
  }, [userId, loading]);

  useEffect(() => {
    if (hydrated && owner) writeList(`${FAVORITES_KEY}_${owner}`, favorites);
  }, [favorites, hydrated, owner]);

  useEffect(() => {
    if (hydrated && owner) writeList(`${COMPARE_KEY}_${owner}`, compare);
  }, [compare, hydrated, owner]);

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
