import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import PropertyMap from "@/components/PropertyMap";

export const metadata = { title: "Map View" };

export default function MapPage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader
          eyebrow="Explore visually"
          title="Map view"
          subtitle="Browse every listing by location — hover the list to preview a pin, click one to zoom in."
        />
        <PropertyMap />
      </main>
      <Footer />
    </>
  );
}
