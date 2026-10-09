import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { listAgents } from "@/lib/queries";
import { Mail, Phone, Star, Home as HomeIcon } from "lucide-react";

export const metadata = { title: "Agents & Brokers" };

export default async function AgentsPage() {
  const agents = await listAgents();

  return (
    <>
      <Header />
      <main>
        <PageHeader eyebrow="Agents" title="Agents & brokers" subtitle="Licensed, reviewed, and quick to reply — browse by specialty or city." />
        <section className="bg-sand-50 py-12">
          <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map((a) => (
              <a key={a.slug} href={`/agents/${a.slug}`} className="card-surface overflow-hidden">
                <img src={a.image} alt={a.name} className="h-52 w-full object-cover" />
                <div className="p-4">
                  <h3 className="font-display text-[17px] text-navy-900">{a.name}</h3>
                  <p className="text-xs text-navy-800/50">{a.agencyName}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-coral-600">
                    <Star size={13} fill="currentColor" /> {a.rating} ({a.reviewCount})
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-navy-800/60">
                    <Phone size={13} /> {a.phone}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-navy-800/60">
                    <Mail size={13} /> {a.email}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-navy-900/8 pt-3">
                    <span className="flex items-center gap-1.5 text-sm text-navy-800/70">
                      <HomeIcon size={14} /> {a.propertiesCount} properties
                    </span>
                    <span className="text-xs font-semibold text-teal-600">View profile</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
