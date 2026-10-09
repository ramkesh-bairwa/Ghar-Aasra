import Script from "next/script";
import "./globals.css";
import { getAllSiteSettings } from "@/lib/queries";
import { fontStack } from "@/lib/siteSettingsSchema";
import { customFavicon, faviconVersion } from "@/lib/themeIcon";
import { SiteSettingsProvider } from "@/components/SiteSettingsProvider";
import { AuthProvider } from "@/lib/useAuth";
import { UserListsProvider } from "@/lib/userLists";
import FloatingDock from "@/components/FloatingDock";
import ScheduleVisitDock from "@/components/ScheduleVisitDock";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import AdPopup from "@/components/ads/AdPopup";
import NavigationProgress from "@/components/NavigationProgress";

export async function generateMetadata() {
  const settings = await getAllSiteSettings();
  const custom = customFavicon(settings);
  const v = faviconVersion(settings);
  const title = settings.site_tagline ? `${settings.site_title} — ${settings.site_tagline}` : settings.site_title;
  return {
    // Pages set a bare title ("Contact Us"); the site name from admin
    // settings is appended here so no page hardcodes the brand.
    title: { default: title, template: `%s — ${settings.site_title}` },
    description: settings.meta_description,
    // A custom favicon from Site Settings wins; otherwise the icon is drawn
    // in the theme colours (app/theme-icon), so it follows theme changes.
    // URLs carry a version so browsers refetch as soon as it changes.
    icons: custom
      ? { icon: `${custom}?v=${v}`, shortcut: `${custom}?v=${v}`, apple: `${custom}?v=${v}` }
      : {
          icon: [
            { url: `/theme-icon?v=${v}`, type: "image/svg+xml" },
            { url: `/theme-icon?size=48&v=${v}`, type: "image/png", sizes: "48x48" },
            { url: `/theme-icon?size=32&v=${v}`, type: "image/png", sizes: "32x32" },
          ],
          shortcut: `/theme-icon?size=32&v=${v}`,
          apple: `/theme-icon?size=180&v=${v}`,
        },
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
        <NavigationProgress />
        <SiteSettingsProvider settings={settings}>
          <AuthProvider>
            <UserListsProvider>
              {children}
              <ScheduleVisitDock />
              <FloatingDock />
              <WhatsAppFloat />
              <AdPopup />
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
