// Seller panel loading state: the dark sidebar + main column of StudioShell,
// so moving between seller pages doesn't flash the public site's header
// skeleton from app/loading.js.
export default function VendorLoading() {
  return (
    <div className="min-h-screen bg-[#f4f5f2]" role="status" aria-label="Loading">
      <aside className="fixed inset-y-0 left-0 hidden w-72 bg-gradient-to-b from-navy-900 to-navy-950 p-5 lg:block">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-white/10" />
        <div className="mt-6 h-12 animate-pulse rounded-2xl bg-white/15" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-xl bg-white/10" />
              <div className="h-4 flex-1 animate-pulse rounded bg-white/5" />
            </div>
          ))}
        </div>
      </aside>
      <div className="lg:pl-72">
        <div className="flex h-20 items-center border-b border-navy-900/5 px-4 md:px-8">
          <div className="space-y-2">
            <div className="skeleton h-6 w-56" />
            <div className="skeleton h-3 w-80 max-w-[60vw]" />
          </div>
        </div>
        <div className="space-y-5 px-4 pt-6 md:px-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
