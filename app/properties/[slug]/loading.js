import Header from "@/components/Header";

// Skeleton in the exact shape of the property detail page (gallery mosaic,
// title + price, highlight strip, section tabs, two-column body) so the
// layout doesn't jump when the real content arrives.
export default function PropertyLoading() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-sand-50" role="status" aria-label="Loading property">
        <div className="container-page pt-6">
          <div className="grid h-[300px] gap-2 sm:h-[440px] md:grid-cols-[2fr,1fr]">
            <div className="skeleton h-full rounded-xl2" />
            <div className="hidden grid-cols-2 grid-rows-2 gap-2 md:grid">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="skeleton h-full" />
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
            <div className="w-full max-w-lg space-y-3">
              <div className="flex gap-2">
                <div className="skeleton h-6 w-16 rounded-full" />
                <div className="skeleton h-6 w-32 rounded-full" />
              </div>
              <div className="skeleton h-9 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
            </div>
            <div className="skeleton h-24 w-48 rounded-xl2" />
          </div>

          <div className="skeleton mt-6 h-24 w-full rounded-xl2" />
        </div>

        <div className="mt-6 border-b border-navy-900/8 bg-white">
          <div className="container-page flex gap-2 py-2.5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>

        <section className="container-page grid gap-8 py-10 lg:grid-cols-[1.6fr,1fr]">
          <div className="space-y-6">
            <div className="card-surface grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 md:grid-cols-5">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="skeleton h-24" />
              ))}
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="card-surface space-y-3 p-6">
                <div className="skeleton h-6 w-48" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-11/12" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <div className="skeleton h-64 rounded-xl2" />
            <div className="card-surface space-y-3 p-5">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full rounded-full" />
            </div>
          </div>
        </section>
        <span className="sr-only">Loading property…</span>
      </main>
    </>
  );
}
