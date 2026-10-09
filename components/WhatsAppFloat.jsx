"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { whatsappUrl } from "@/lib/visitSlots";

// True on a single property's detail page (not /properties/new or /visit),
// where StickyVisitBar already carries a WhatsApp button on mobile.
export function isPropertyDetailPath(pathname) {
  return /^\/properties\/[^/]+$/.test(pathname || "") && pathname !== "/properties/new";
}

// Site-wide WhatsApp shortcut. The prefilled message carries the current
// page's URL so the team instantly knows which listing the person means.
export default function WhatsAppFloat() {
  const { contact_whatsapp } = useSiteSettings();
  const pathname = usePathname();
  const [pageUrl, setPageUrl] = useState("");
  useEffect(() => setPageUrl(window.location.href), [pathname]);

  if (!contact_whatsapp || /^\/(admin|vendor)(\/|$)/.test(pathname || "")) return null;

  const onProperty = isPropertyDetailPath(pathname);
  const href = whatsappUrl(
    contact_whatsapp,
    onProperty ? `Hi! I'd like to visit this property: ${pageUrl}` : "Hi! I'm looking for a property and would like to book a visit."
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={`group fixed bottom-5 left-3 z-50 items-center gap-2 rounded-full bg-[#25D366] p-3 text-white shadow-card transition-transform hover:scale-105 md:left-5 ${
        onProperty ? "hidden md:flex" : "flex"
      }`}
    >
      <MessageCircle size={22} />
      <span className="hidden pr-1 text-sm font-semibold lg:inline">Chat on WhatsApp</span>
    </a>
  );
}
