import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EnquiryForm from "@/components/EnquiryForm";
import { getProjectBySlug, listDevelopers, listLocations, listProperties } from "@/lib/queries";
import { MapPin, Building, Calendar, Layers, Check } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";

export async function generateMetadata({ params }) {
  const project = await getProjectBySlug(params.slug);
  return { title: project ? `${project.name}` : "Project" };
}

const statusLabel = { presale: "Presale", under_construction: "Under construction", selling: "Selling now", completed: "Completed" };

export default async function ProjectDetailsPage({ params }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();

  const [developers, locations, allProperties] = await Promise.all([listDevelopers(), listLocations(), listProperties()]);
  const developer = developers.find((d) => d.id === project.developerId);
  const location = locations.find((l) => l.id === project.locationId);
  const units = allProperties.filter((p) => p.projectId === project.id);

  return (
    <>
      <Header />
      <main className="bg-sand-50">
        <div className="relative h-[380px] w-full">
          <img src={project.image} alt={project.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/10 to-transparent" />
          <div className="container-page absolute inset-x-0 bottom-6">
            <span className="badge-pill bg-teal-500 text-white">{statusLabel[project.status] || project.status}</span>
            <h1 className="mt-3 font-display text-3xl text-white md:text-4xl">{project.name}</h1>
            {location && (
              <p className="mt-1 flex items-center gap-1.5 text-white/75">
                <MapPin size={15} /> {location.city}
              </p>
            )}
          </div>
        </div>

        <section className="container-page grid gap-8 py-12 lg:grid-cols-[1.6fr,1fr]">
          <div>
            <div className="card-surface grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-navy-800/50"><Calendar size={13} /> Handover</div>
                <div className="mt-1 text-sm font-semibold text-navy-900">{project.handover}</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-navy-800/50"><Layers size={13} /> Total units</div>
                <div className="mt-1 text-sm font-semibold text-navy-900">{project.totalUnits}</div>
              </div>
              <div>
                <div className="text-xs text-navy-800/50">Starting price</div>
                <div className="mt-1 text-sm font-semibold text-navy-900">{project.startingPrice}</div>
              </div>
              <div>
                <div className="text-xs text-navy-800/50">Status</div>
                <div className="mt-1 text-sm font-semibold text-navy-900">{statusLabel[project.status]}</div>
              </div>
            </div>

            <div className="card-surface mt-6 p-6">
              <h2 className="font-display text-xl text-navy-900">About this project</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-navy-800/70">{project.description}</p>
            </div>

            {project.amenities?.length > 0 && (
              <div className="card-surface mt-6 p-6">
                <h2 className="font-display text-xl text-navy-900">Amenities</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {project.amenities.map((a) => (
                    <span key={a} className="flex items-center gap-2 text-sm text-navy-800/70">
                      <Check size={15} className="shrink-0 text-teal-600" /> {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {project.gallery?.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-3">
                {project.gallery.map((g, i) => (
                  <img key={i} src={g} alt="" className="h-28 w-full rounded-xl2 object-cover sm:h-40" />
                ))}
              </div>
            )}

            {units.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-xl text-navy-900">Available units</h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  {units.map((u) => (
                    <PropertyCard key={u.slug} property={u} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {developer && (
              <a href={`/developers/${developer.slug}`} className="card-surface flex items-center gap-4 p-5">
                <img src={developer.logo} alt={developer.companyName} className="h-14 w-14 rounded-xl object-cover" />
                <div>
                  <div className="text-xs text-navy-800/50">Developed by</div>
                  <div className="font-display text-[16px] text-navy-900">{developer.companyName}</div>
                  <div className="text-xs text-teal-600">View developer</div>
                </div>
              </a>
            )}
            <EnquiryForm projectId={project.id} heading="Reserve a unit / ask a question" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
