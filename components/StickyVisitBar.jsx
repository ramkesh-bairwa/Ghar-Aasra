"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, MessageCircle, CalendarCheck } from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { useAuth } from "@/lib/useAuth";
import { whatsappUrl } from "@/lib/visitSlots";

// Mobile-only bottom bar on the property page, so "Book visit" / call /
// WhatsApp are always one thumb-tap away however far the visitor scrolls.
export default function StickyVisitBar({ property }) {
  const { contact_phone, contact_whatsapp } = useSiteSettings();
  const { user } = useAuth();
  // Read after mount so server and client render the same href first.
  const [pageUrl, setPageUrl] = useState("");
  useEffect(() => setPageUrl(window.location.href), []);
  const wa = whatsappUrl(contact_whatsapp, `Hi! I'm interested in "${property.title}"${user ? ` (${property.price})` : ""}. ${pageUrl}`.trim());

  return (
    <>
      {/* Spacer so the fixed bar never covers the end of the page. */}
      <div className="h-20 md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-900/10 bg-white/95 px-3 py-2.5 shadow-[0_-6px_20px_-10px_rgba(15,27,45,0.25)] backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] text-navy-800/50">{property.title}</div>
            <div className="truncate font-display text-base text-navy-900">{user ? property.price : "Sign in to see price"}</div>
          </div>
          {contact_phone && (
            <a
              href={`tel:${contact_phone.replace(/[^\d+]/g, "")}`}
              aria-label="Call us"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-navy-900/10 text-navy-900"
            >
              <Phone size={18} />
            </a>
          )}
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat on WhatsApp"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white"
            >
              <MessageCircle size={18} />
            </a>
          )}
          <Link href={`/properties/${property.slug}/visit`} className="btn-primary shrink-0 px-4 py-2.5">
            <CalendarCheck size={16} /> Book visit
          </Link>
        </div>
      </div>
    </>
  );
}
