"use client";

import { GitCompare } from "lucide-react";
import { useUserLists } from "@/lib/userLists";
import CompareTable from "@/components/CompareTable";

// Shows the shortlist comparison inline at the bottom of a property page
// once the visitor has actually added something to compare — stays hidden
// otherwise so browsing pages that aren't comparing anything don't show an
// empty "nothing to compare" block.
export default function PropertyPageCompare() {
  const { compare, hydrated } = useUserLists();
  if (!hydrated || compare.length === 0) return null;

  return (
    <section id="inline-compare" className="border-t border-navy-900/8 bg-white pt-10">
      <div className="container-page flex items-center gap-2">
        <GitCompare className="text-teal-600" size={20} />
        <h2 className="font-display text-2xl text-navy-900">Your comparison</h2>
      </div>
      <CompareTable />
    </section>
  );
}
