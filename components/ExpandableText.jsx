"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Long descriptions collapse to a few lines with a "Read more" toggle so the
// rest of the page (amenities, pricing, booking) stays within easy reach.
export default function ExpandableText({ text, limit = 360 }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = text.length > limit;
  const shown = !long || open ? text : `${text.slice(0, limit).replace(/\s+\S*$/, "")}…`;

  return (
    <div>
      <p className="whitespace-pre-line text-[15px] leading-relaxed text-navy-800/70">{shown}</p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-2 flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700"
        >
          {open ? "Show less" : "Read more"}
          <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
