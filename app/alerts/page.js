import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import RequireAuth from "@/components/RequireAuth";
import AlertsCenter from "@/components/AlertsCenter";

export const metadata = { title: "My Alerts" };

export default function AlertsPage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader eyebrow="Never miss a home" title="My alerts" subtitle="New listings for your saved searches, and price drops on homes you're watching." />
        <RequireAuth>
          <AlertsCenter />
        </RequireAuth>
      </main>
      <Footer />
    </>
  );
}
