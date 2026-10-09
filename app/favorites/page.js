import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import FavoritesGrid from "@/components/FavoritesGrid";
import RequireAuth from "@/components/RequireAuth";

export const metadata = { title: "My Favorites" };

export default function FavoritesPage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader
          eyebrow="Your shortlist"
          title="Saved properties"
          subtitle="Everything you've hearted, kept right here on this device."
        />
        <RequireAuth>
          <FavoritesGrid />
        </RequireAuth>
      </main>
      <Footer />
    </>
  );
}
