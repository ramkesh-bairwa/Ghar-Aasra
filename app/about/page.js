import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { getStaticPage, listStats, getAllSiteSettings } from "@/lib/queries";

export const metadata = { title: "About Us" };

export default async function AboutPage() {
  const [page, stats, settings] = await Promise.all([getStaticPage("about-us"), listStats(), getAllSiteSettings()]);

  return (
    <>
      <Header />
      <main>
        <PageHeader eyebrow="About" title={page?.title || `About ${settings.site_title}`} />
        <section className="bg-white py-14">
          <div className="container-page grid gap-10 lg:grid-cols-[1.4fr,1fr]">
            <div className="prose-content whitespace-pre-line text-[15px] leading-relaxed text-navy-800/75">
              {page?.content}
            </div>
            <div className="card-surface h-fit p-6">
              <h3 className="font-display text-lg text-navy-900">{settings.site_title} in numbers</h3>
              <dl className="mt-4 space-y-4">
                {stats.map((s) => (
                  <div key={s.label} className="flex items-center justify-between border-b border-navy-900/8 pb-3 last:border-0">
                    <dt className="text-sm text-navy-800/60">{s.label}</dt>
                    <dd className="font-display text-lg text-navy-900">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
