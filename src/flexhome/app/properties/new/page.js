import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import AddPropertyForm from "@/components/AddPropertyForm";
import RequireAuth from "@/components/RequireAuth";
import { listLocations, getAmenities } from "@/lib/queries";

export const metadata = { title: "Add Property — Flex Home" };

export default async function AddPropertyPage() {
  const [locations, amenities] = await Promise.all([listLocations(), getAmenities()]);

  return (
    <>
      <Header />
      <main className="bg-sand-50">
        <PageHeader
          eyebrow="List with us"
          title="Add your property"
          subtitle="Publish a listing in minutes — add the details, a few photos, and it goes live right away."
        />
        <section className="py-10 md:py-14">
          <div className="container-page">
            <RequireAuth>
              <AddPropertyForm locations={locations} amenities={amenities} />
            </RequireAuth>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
