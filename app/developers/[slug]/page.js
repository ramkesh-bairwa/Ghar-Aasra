import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getDeveloperBySlug, listProjects } from "@/lib/queries";
import { Globe, Calendar, Layers } from "lucide-react";

export async function generateMetadata({ params }) {
  const developer = await getDeveloperBySlug(params.slug);
  return { title: developer ? `${developer.companyName}` : "Developer" };
}

const statusLabel = { presale: "Presale", under_construction: "Under construction", selling: "Selling now", completed: "Completed" };

export default async function DeveloperProfilePage({ params }) {
  const developer = await getDeveloperBySlug(params.slug);
  if (!developer) notFound();

  const allProjects = await listProjects();
  const projects = allProjects.filter((p) => p.developerId === developer.id);

  return (
    <>
      <Header />
      <main className="bg-sand-50">
        <section className="border-b border-navy-900/8 bg-navy-900 py-14">
          <div className="container-page flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <img src={developer.logo} alt={developer.companyName} className="h-24 w-24 rounded-xl2 object-cover ring-4 ring-white/10" />
            <div>
              <h1 className="font-display text-3xl text-white">{developer.companyName}</h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-white/70 sm:justify-start">
                <span className="flex items-center gap-1"><Calendar size={14} /> Founded {developer.foundedYear}</span>
                <span className="flex items-center gap-1"><Layers size={14} /> {projects.length} active projects</span>
                {developer.website && (
                  <span className="flex items-center gap-1"><Globe size={14} /> {developer.website}</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="container-page py-12">
          <div className="card-surface p-6">
            <h2 className="font-display text-xl text-navy-900">About {developer.companyName}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-navy-800/70">{developer.description}</p>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-xl text-navy-900">Projects</h2>
            {projects.length === 0 ? (
              <p className="mt-3 text-sm text-navy-800/55">No active projects listed right now.</p>
            ) : (
              <div className="mt-4 grid gap-6 lg:grid-cols-3">
                {projects.map((p) => (
                  <a key={p.slug} href={`/projects/${p.slug}`} className="card-surface group block overflow-hidden">
                    <img src={p.image} alt={p.name} className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="p-4">
                      <h3 className="font-display text-lg text-navy-900">{p.name}</h3>
                      <p className="mt-1 text-sm text-navy-800/55">{statusLabel[p.status] || p.status}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
