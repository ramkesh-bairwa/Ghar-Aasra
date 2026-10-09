import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { getStaticPage } from "@/lib/queries";

export const metadata = { title: "Terms & Conditions" };

export default async function TermsPage() {
  const page = await getStaticPage("terms");
  return (
    <>
      <Header />
      <main>
        <PageHeader eyebrow="Legal" title={page?.title || "Terms & Conditions"} />
        <section className="bg-white py-14">
          <div className="container-page mx-auto max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-navy-800/75">
            {page?.content}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
