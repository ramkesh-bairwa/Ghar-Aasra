import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import EnquiryForm from "@/components/EnquiryForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const metadata = { title: "Contact Us — Flex Home" };

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader eyebrow="Contact" title="Get in touch" subtitle="Questions about a listing, an agent, or the platform itself — we're reachable." />
        <section className="bg-sand-50 py-14">
          <div className="container-page grid gap-8 lg:grid-cols-[1fr,1.2fr]">
            <div className="space-y-4">
              <div className="card-surface flex items-start gap-3 p-5">
                <MapPin className="mt-0.5 text-teal-600" size={18} />
                <div>
                  <div className="text-sm font-semibold text-navy-900">Office</div>
                  <div className="text-sm text-navy-800/60">North Link Building, 10 Admiralty Street, Singapore 757695</div>
                </div>
              </div>
              <div className="card-surface flex items-start gap-3 p-5">
                <Phone className="mt-0.5 text-teal-600" size={18} />
                <div>
                  <div className="text-sm font-semibold text-navy-900">Phone</div>
                  <div className="text-sm text-navy-800/60">1-800-062-68</div>
                </div>
              </div>
              <div className="card-surface flex items-start gap-3 p-5">
                <Mail className="mt-0.5 text-teal-600" size={18} />
                <div>
                  <div className="text-sm font-semibold text-navy-900">Email</div>
                  <div className="text-sm text-navy-800/60">hello@flexhome.com</div>
                </div>
              </div>
              <div className="card-surface flex items-start gap-3 p-5">
                <Clock className="mt-0.5 text-teal-600" size={18} />
                <div>
                  <div className="text-sm font-semibold text-navy-900">Hours</div>
                  <div className="text-sm text-navy-800/60">Monday – Friday, 9am – 6pm SGT</div>
                </div>
              </div>
            </div>

            <EnquiryForm heading="Send us a message" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
