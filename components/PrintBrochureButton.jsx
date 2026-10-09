"use client";

import { Printer } from "lucide-react";

// Browser print dialog doubles as "Save as PDF" — print:hidden classes on
// the page chrome (header, docks, booking widgets) keep the output to the
// listing itself.
export default function PrintBrochureButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-1.5 rounded-full bg-sand-100 px-3.5 py-2 text-sm font-semibold text-navy-800 transition-colors hover:bg-navy-900/10 print:hidden"
    >
      <Printer size={15} /> Brochure / PDF
    </button>
  );
}
