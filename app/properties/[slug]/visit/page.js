import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import BookVisitForm from "@/components/BookVisitForm";
import RequireAuth from "@/components/RequireAuth";
import { getPropertyBySlug } from "@/lib/queries";

export async function generateMetadata({ params }) {
  const property = await getPropertyBySlug(params.slug);
  return { title: property ? `Book a visit — ${property.title} — Flex Home` : "Book a visit — Flex Home" };
}

export default async function BookVisitPage({ params }) {
  const property = await getPropertyBySlug(params.slug);
  if (!property) notFound();

  return (
    <>
      <Header />
      <main className="bg-sand-50">
        <PageHeader
          eyebrow="Schedule a viewing"
          title="Book a visit"
          subtitle={`Pick a day and time that works for you to tour ${property.title}.`}
        />
        <section className="py-10 md:py-14">
          <div className="container-page">
            <RequireAuth>
              <BookVisitForm property={property} />
            </RequireAuth>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
