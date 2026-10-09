"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle, Send } from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { whatsappUrl } from "@/lib/visitSlots";

const QUICK_QUESTIONS = [
  "Is this property still available?",
  "Is the price negotiable?",
  "Can I visit this weekend?",
  "What are the nearby schools and hospitals?",
  "Are pets allowed?",
  "What documents are needed to book?",
];

// Two blocks in one: an FAQ built only from this listing's own data (so
// every answer is true for it), and one-tap question chips that open
// WhatsApp, or prefill the enquiry form when WhatsApp isn't configured.
export default function PropertyQuestions({ faqs, propertyTitle }) {
  const { contact_whatsapp } = useSiteSettings();
  const [openIndex, setOpenIndex] = useState(0);

  function ask(question) {
    const wa = whatsappUrl(contact_whatsapp, `Hi! About "${propertyTitle}" (${window.location.href}): ${question}`);
    if (wa) {
      window.open(wa, "_blank", "noopener,noreferrer");
      return;
    }
    window.dispatchEvent(new CustomEvent("fh:prefill-enquiry", { detail: question }));
  }

  return (
    <div>
      {faqs.length > 0 && (
        <div className="divide-y divide-navy-900/8 rounded-xl2 ring-1 ring-navy-900/8">
          {faqs.map((f, i) => {
            const open = openIndex === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-navy-900 hover:bg-sand-50"
                >
                  {f.q}
                  <ChevronDown size={16} className={`shrink-0 text-navy-800/40 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && <p className="px-4 pb-4 text-sm leading-relaxed text-navy-800/65">{f.a}</p>}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <div className="text-sm font-semibold text-navy-900">Have a question? Ask in one tap</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="flex items-center gap-1.5 rounded-full border border-navy-900/10 bg-white px-3.5 py-2 text-xs font-medium text-navy-800/80 transition-colors hover:border-teal-500 hover:text-teal-700"
            >
              {contact_whatsapp ? <MessageCircle size={13} className="text-[#25D366]" /> : <Send size={12} className="text-teal-600" />}
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
