// Placeholder in the shape of the admin panel (dark sidebar, top bar, stat
// tiles, table) — used by app/admin/loading.js during route changes and by
// AdminGate while the session is checked on first load.
export default function AdminSkeleton() {
  return (
    <div className="flex h-screen bg-sand-50" role="status" aria-label="Loading">
      <aside className="hidden w-64 shrink-0 flex-col gap-3 bg-navy-900 p-5 md:flex">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-white/10" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center border-b border-navy-900/8 bg-white px-6 lg:px-8">
          <div className="skeleton h-4 w-40" />
        </div>
        <div className="space-y-4 p-6 lg:p-8">
          <AdminContentSkeleton />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// Just the main-area part, for use inside an already-rendered AdminShell.
export function AdminContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl2" />
        ))}
      </div>
      <div className="card-surface space-y-3 p-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-9 w-full" />
        ))}
      </div>
    </div>
  );
}

// Shimmering placeholder rows for an admin <tbody> while its data loads.
export function TableSkeletonRows({ cols, rows = 6 }) {
  return Array.from({ length: rows }, (_, r) => (
    <tr key={r} className="border-b border-navy-900/5 last:border-0">
      {Array.from({ length: cols }, (_, c) => (
        <td key={c} className="px-4 py-3.5">
          <div className={`skeleton h-4 ${c === 0 ? "w-3/4" : c === cols - 1 ? "ml-auto w-16" : "w-2/3"}`} />
        </td>
      ))}
    </tr>
  ));
}

// Stack of card-shaped placeholders (Visit Bookings list, settings form).
export function CardSkeletonList({ count = 4, height = "h-28" }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`skeleton ${height} rounded-xl2`} />
      ))}
    </div>
  );
}
