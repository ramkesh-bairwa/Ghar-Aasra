import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import BookVisitForm from "@/components/BookVisitForm";
import { getPropertyBySlug } from "@/lib/queries";

export async function generateMetadata({ params }) {
  const property = await getPropertyBySlug(params.slug);
  return { title: property ? `Book a visit — ${property.title}` : "Book a visit" };
}

// Open to guests on purpose — BookVisitForm collects name + phone when
// nobody is signed in, so a visitor is never sent to a login page mid-booking.
// ?date=YYYY-MM-DD&time=HH:MM preselects a slot picked on the property page.
export default async function BookVisitPage({ params, searchParams }) {
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
            <BookVisitForm property={property} initialDate={searchParams?.date} initialTime={searchParams?.time} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
