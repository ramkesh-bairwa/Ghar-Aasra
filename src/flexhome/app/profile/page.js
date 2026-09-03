import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ProfileView from "@/components/ProfileView";
import RequireAuth from "@/components/RequireAuth";

export const metadata = { title: "My Profile — Flex Home" };

export default function ProfilePage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader
          eyebrow="Your account"
          title="Profile"
          subtitle="Manage your details and jump back into your bookings, favorites, and compares."
        />
        <RequireAuth>
          <ProfileView />
        </RequireAuth>
      </main>
      <Footer />
    </>
  );
}
