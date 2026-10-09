import Header from "@/components/Header";

// Default loading state for every public route: the real header stays put
// and the page body is sketched as shimmering placeholders (a page heading
// plus a grid of property-card shapes) until the page streams in.
export default function Loading() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-sand-50" role="status" aria-label="Loading page">
        <div className="border-b border-navy-900/8 bg-white py-12">
          <div className="container-page space-y-3">
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-9 w-2/3 max-w-md" />
            <div className="skeleton h-4 w-full max-w-xl" />
          </div>
        </div>
        <div className="container-page grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card-surface overflow-hidden">
              <div className="skeleton h-52 rounded-none" />
              <div className="space-y-3 p-4">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-3.5 w-1/2" />
                <div className="flex gap-3 border-t border-navy-900/8 pt-3">
                  <div className="skeleton h-3.5 w-14" />
                  <div className="skeleton h-3.5 w-14" />
                  <div className="skeleton h-3.5 w-14" />
                </div>
                <div className="skeleton h-10 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <span className="sr-only">Loading…</span>
      </main>
    </>
  );
}
