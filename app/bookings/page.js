import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import MyVisitsView from "@/components/MyVisitsView";
import RequireAuth from "@/components/RequireAuth";

export const metadata = { title: "My Visits" };

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
          <MyVisitsView />
        </RequireAuth>
      </main>
      <Footer />
    </>
  );
}
