"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function Pagination({ page, pageCount, pageSize, total, onPageChange, onPageSizeChange }) {
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = [];
  const span = 1;
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || (p >= page - span && p <= page + span)) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
      <span className="text-navy-800/50">
        {start}–{end} of {total}
      </span>

      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="h-8 rounded-lg border border-navy-900/10 bg-white px-2 text-xs text-navy-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
      >
        {PAGE_SIZE_OPTIONS.map((n) => (
          <option key={n} value={n}>{n} / page</option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-navy-900/10 bg-white text-navy-800/60 transition-colors hover:text-navy-900 disabled:opacity-30 disabled:hover:text-navy-800/60"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-navy-800/30">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors ${
                p === page
                  ? "bg-navy-900 text-white"
                  : "border border-navy-900/10 bg-white text-navy-800/60 hover:text-navy-900"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-navy-900/10 bg-white text-navy-800/60 transition-colors hover:text-navy-900 disabled:opacity-30 disabled:hover:text-navy-800/60"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
