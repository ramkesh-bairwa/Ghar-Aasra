"use client";

import { useEffect, useState } from "react";

// Sticky in-page tabs for the property page. Highlights whichever section is
// currently in view (scroll-spy) and smooth-scrolls on click. Only sections
// that actually rendered (ids present in the DOM) get a tab.
export default function PropertySectionNav({ sections }) {
  const [present, setPresent] = useState(sections);
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const found = sections.filter((s) => document.getElementById(s.id));
    setPresent(found);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-150px 0px -55% 0px" }
    );
    found.forEach((s) => observer.observe(document.getElementById(s.id)));
    return () => observer.disconnect();
  }, [sections]);

  function jump(id) {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: "smooth" });
  }

  return (
    <div className="sticky top-[76px] z-30 border-b border-navy-900/8 bg-white/90 backdrop-blur print:hidden">
      <div className="container-page">
        <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 py-2" aria-label="Property sections">
          {present.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => jump(s.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active === s.id ? "bg-navy-900 text-white" : "text-navy-800/65 hover:bg-sand-100 hover:text-navy-900"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
