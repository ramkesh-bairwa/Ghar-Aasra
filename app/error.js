"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

const RELOAD_KEY = "fh_chunk_reload";

// After a new deploy, a tab that was opened on the previous build asks for
// JavaScript files that no longer exist, so pages and loaders stop working.
// Reloading once picks up the new build; the session flag stops a loop if
// the error is something else.
function isStaleBuild(error) {
  const text = `${error?.name || ""} ${error?.message || ""}`;
  return /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module/i.test(text);
}

export default function Error({ error, reset }) {
  useEffect(() => {
    if (!isStaleBuild(error)) return;
    try {
      if (sessionStorage.getItem(RELOAD_KEY)) return;
      sessionStorage.setItem(RELOAD_KEY, "1");
    } catch {
      /* storage blocked — still try one reload */
    }
    window.location.reload();
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-sand-50 px-4">
      <div className="max-w-md rounded-xl2 bg-white p-8 text-center shadow-card ring-1 ring-navy-900/5">
        <h2 className="font-display text-xl text-navy-900">This page didn&apos;t load properly</h2>
        <p className="mt-2 text-sm text-navy-800/60">
          {isStaleBuild(error)
            ? "The site was just updated. Reload to get the latest version."
            : "Something went wrong while loading this page. Please try again."}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" onClick={() => reset()} className="btn-outline">
            Try again
          </button>
          <button type="button" onClick={() => window.location.reload()} className="btn-primary">
            <RefreshCw size={15} /> Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
