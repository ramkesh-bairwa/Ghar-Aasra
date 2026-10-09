import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import CompareTable from "@/components/CompareTable";
import RequireAuth from "@/components/RequireAuth";

export const metadata = { title: "My Compares" };

export default function ComparePage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader
          eyebrow="Side by side"
          title="Compare properties"
          subtitle="Line up price, size, and features across the listings you're deciding between."
        />
        <RequireAuth>
          <CompareTable />
        </RequireAuth>
      </main>
      <Footer />
    </>
  );
}
