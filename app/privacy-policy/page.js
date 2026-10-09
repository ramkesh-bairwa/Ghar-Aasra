import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { getStaticPage } from "@/lib/queries";

export const metadata = { title: "Privacy Policy" };

export default async function PrivacyPolicyPage() {
  const page = await getStaticPage("privacy-policy");
  return (
    <>
      <Header />
      <main>
        <PageHeader eyebrow="Legal" title={page?.title || "Privacy Policy"} />
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
