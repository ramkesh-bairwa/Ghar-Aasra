import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import BookingsList from "@/components/BookingsList";
import VisitRequestsList from "@/components/VisitRequestsList";
import RequireAuth from "@/components/RequireAuth";

export const metadata = { title: "My Visits — Flex Home" };

export default function BookingsPage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader
          eyebrow="Your visits"
          title="My Visits"
          subtitle="Track the property viewings you've scheduled with our agents."
        />
        <RequireAuth>
          <BookingsList />
          <VisitRequestsList />
        </RequireAuth>
      </main>
      <Footer />
    </>
  );
}
