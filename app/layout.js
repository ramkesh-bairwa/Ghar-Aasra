import Script from "next/script";
import "./globals.css";
import { getAllSiteSettings } from "@/lib/queries";
import { fontStack } from "@/lib/siteSettingsSchema";
import { SiteSettingsProvider } from "@/components/SiteSettingsProvider";
import { AuthProvider } from "@/lib/useAuth";
import { UserListsProvider } from "@/lib/userLists";
import FloatingDock from "@/components/FloatingDock";
import ScheduleVisitDock from "@/components/ScheduleVisitDock";

export async function generateMetadata() {
  const settings = await getAllSiteSettings();
  const title = settings.site_tagline ? `${settings.site_title} — ${settings.site_tagline}` : settings.site_title;
  return {
    title,
    description: settings.meta_description,
    icons: settings.favicon_url ? { icon: settings.favicon_url } : undefined,
    openGraph: {
      title,
      description: settings.meta_description,
      images: settings.og_image_url ? [settings.og_image_url] : undefined,
    },
  };
}

const GA_ID_PATTERN = /^(G|UA|AW|GT)-[A-Za-z0-9-]+$/;

export default async function RootLayout({ children }) {
  const settings = await getAllSiteSettings();
  const gaId = GA_ID_PATTERN.test(settings.google_analytics_id || "") ? settings.google_analytics_id : null;

  // Theme colors, fonts, and base size are set as CSS custom properties
  // directly on <html> — every Tailwind class that references them
  // (navy-900, teal-500, font-display, …) picks up the admin's choices
  // without any component-level changes. See app/globals.css for the
  // default values and the color-mix() shade derivations.
  const themeVars = {
    "--color-primary": settings.primary_color,
    "--color-navy-900": settings.primary_color,
    "--color-secondary": settings.secondary_color,
    "--color-teal-500": settings.secondary_color,
    "--color-accent": settings.accent_color,
    "--color-coral-500": settings.accent_color,
    "--color-sand-50": settings.background_color,
    "--color-text": settings.text_color,
    "--font-display": fontStack(settings.heading_font),
    "--font-sans": fontStack(settings.body_font),
    "--base-font-size": `${settings.base_font_size}px`,
  };

  return (
    <html lang="en" style={themeVars}>
      <body className="font-sans antialiased">
        <SiteSettingsProvider settings={settings}>
          <AuthProvider>
            <UserListsProvider>
              {children}
              <ScheduleVisitDock />
              <FloatingDock />
            </UserListsProvider>
          </AuthProvider>
        </SiteSettingsProvider>
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
