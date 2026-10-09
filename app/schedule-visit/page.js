import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ScheduleVisitForm from "@/components/ScheduleVisitForm";

export const metadata = { title: "Schedule a Visit" };

export default function ScheduleVisitPage({ searchParams }) {
  return (
    <>
      <Header />
      <main className="bg-sand-50">
        <PageHeader
          eyebrow="We'll come to you"
          title="Schedule a visit"
          subtitle="Pick a day and time that works for you — with a specific property in mind or not, we'll take it from here."
        />
        <section className="py-10 md:py-14">
          <div className="container-page">
            <ScheduleVisitForm initialPropertySlug={searchParams?.property} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
