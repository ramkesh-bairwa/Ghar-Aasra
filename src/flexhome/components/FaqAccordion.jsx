"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FaqAccordion({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card-surface overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-[15px] font-medium text-navy-900">{question}</span>
        <ChevronDown size={18} className={`shrink-0 text-navy-800/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-5 pb-4 text-sm leading-relaxed text-navy-800/65">{answer}</p>}
    </div>
  );
}
