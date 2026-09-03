import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import FaqAccordion from "@/components/FaqAccordion";
import { listFaqs } from "@/lib/queries";

export const metadata = { title: "FAQ — Flex Home" };

export default async function FaqPage() {
  const faqs = await listFaqs();
  const categories = [...new Set(faqs.map((f) => f.category))];

  return (
    <>
      <Header />
      <main>
        <PageHeader eyebrow="FAQ" title="Frequently asked questions" subtitle="Buying, renting, selling, and new projects — answered." />
        <section className="bg-sand-50 py-14">
          <div className="container-page mx-auto max-w-2xl space-y-10">
            {categories.map((cat) => (
              <div key={cat}>
                <h2 className="font-display text-xl text-navy-900">{cat}</h2>
                <div className="mt-4 space-y-3">
                  {faqs.filter((f) => f.category === cat).map((f) => (
                    <FaqAccordion key={f.id} question={f.question} answer={f.answer} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
