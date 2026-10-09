import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EnquiryForm from "@/components/EnquiryForm";
import PropertyCard from "@/components/PropertyCard";
import { getAgentBySlug, listProperties } from "@/lib/queries";
import { Phone, Mail, MessageCircle, Star, Award } from "lucide-react";

export async function generateMetadata({ params }) {
  const agent = await getAgentBySlug(params.id);
  return { title: agent ? `${agent.name} — Agent` : "Agent" };
}

export default async function AgentProfilePage({ params }) {
  const agent = await getAgentBySlug(params.id);
  if (!agent) notFound();

  const allProperties = await listProperties();
  const listings = allProperties.filter((p) => p.agentId === agent.id);

  return (
    <>
      <Header />
      <main className="bg-sand-50">
        <section className="border-b border-navy-900/8 bg-navy-900 py-14">
          <div className="container-page flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <img src={agent.image} alt={agent.name} className="h-28 w-28 rounded-full object-cover ring-4 ring-white/10" />
            <div>
              <h1 className="font-display text-3xl text-white">{agent.name}</h1>
              <p className="mt-1 text-white/60">{agent.agencyName}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-white/70 sm:justify-start">
                <span className="flex items-center gap-1 text-coral-400">
                  <Star size={14} fill="currentColor" /> {agent.rating} ({agent.reviewCount} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <Award size={14} /> {agent.yearsExperience} years experience
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="container-page grid gap-8 py-12 lg:grid-cols-[1.6fr,1fr]">
          <div>
            <div className="card-surface p-6">
              <h2 className="font-display text-xl text-navy-900">About {agent.name.split(" ")[0]}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-navy-800/70">{agent.bio}</p>
            </div>

            <div className="mt-8">
              <h2 className="font-display text-xl text-navy-900">Current listings</h2>
              {listings.length === 0 ? (
                <p className="mt-3 text-sm text-navy-800/55">No active listings right now.</p>
              ) : (
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  {listings.map((p) => (
                    <PropertyCard key={p.slug} property={p} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-surface space-y-3 p-5">
              <a href={`tel:${agent.phone}`} className="flex items-center gap-2.5 text-sm text-navy-800/75 hover:text-teal-600">
                <Phone size={15} /> {agent.phone}
              </a>
              <a href={`mailto:${agent.email}`} className="flex items-center gap-2.5 text-sm text-navy-800/75 hover:text-teal-600">
                <Mail size={15} /> {agent.email}
              </a>
              {agent.whatsapp && (
                <a href={`https://wa.me/${agent.whatsapp.replace(/[^\d]/g, "")}`} className="flex items-center gap-2.5 text-sm text-navy-800/75 hover:text-teal-600">
                  <MessageCircle size={15} /> WhatsApp
                </a>
              )}
            </div>
            <EnquiryForm agentId={agent.id} heading={`Message ${agent.name.split(" ")[0]}`} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
