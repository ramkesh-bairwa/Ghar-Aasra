"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const START_EVENT = "fh:nav-start";

// Call before a programmatic router.push() so the bar shows for navigations
// that don't come from clicking a link (search submit, filters, buttons).
export function startNavProgress() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(START_EVENT));
}

function isInternalNavigation(anchor, event) {
  if (!anchor || event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  // Same page (or only the #hash differs): Next won't navigate, so no bar.
  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0); // 0 = hidden
  const [visible, setVisible] = useState(false);
  const trickle = useRef(null);
  const safety = useRef(null);
  const active = useRef(false);
  const lastUrl = useRef("");

  function start() {
    if (active.current) return;
    active.current = true;
    setVisible(true);
    setProgress(8);
    clearInterval(trickle.current);
    // Creep towards 90% (fast at first, slower as it goes) until the new
    // route actually renders; never reaches 100% on its own.
    trickle.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + (90 - p) * 0.08 : p));
    }, 200);
    clearTimeout(safety.current);
    safety.current = setTimeout(finish, 12000);
  }

  function finish() {
    if (!active.current) return;
    active.current = false;
    clearInterval(trickle.current);
    clearTimeout(safety.current);
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }

  // A changed URL means the new page has rendered.
  useEffect(() => {
    lastUrl.current = window.location.pathname + window.location.search;
    finish();
  }, [pathname, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Capture phase: Next's <Link> calls preventDefault() in its own React
    // handler, which runs before a bubbling document listener would.
    function onClick(e) {
      const anchor = e.target.closest?.("a");
      // Buttons nested in a link (e.g. save/compare on a property card)
      // handle their own action and don't navigate.
      if (anchor && e.target.closest("button") && anchor.contains(e.target.closest("button"))) return;
      if (isInternalNavigation(anchor, e)) start();
    }
    // Back/forward: location has already changed when popstate fires, so
    // only start if the path or query differs from the rendered page.
    function onPopState() {
      if (window.location.pathname + window.location.search !== lastUrl.current) start();
    }
    window.addEventListener(START_EVENT, start);
    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener(START_EVENT, start);
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onClick, true);
      clearInterval(trickle.current);
      clearTimeout(safety.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] transition-opacity duration-300 print:hidden ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className="h-full bg-teal-500 shadow-[0_0_10px_var(--color-teal-500)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// useSearchParams() needs a Suspense boundary when used from the root layout.
export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
