"use client";

import { createContext, useContext } from "react";
import { SETTINGS_DEFAULTS } from "@/lib/siteSettingsSchema";

const SiteSettingsContext = createContext(SETTINGS_DEFAULTS);

// `settings` is a plain string-keyed object fetched server-side (root
// layout) via getAllSiteSettings() — already merged with SETTINGS_DEFAULTS,
// so every key is always present here too.
export function SiteSettingsProvider({ settings, children }) {
  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
