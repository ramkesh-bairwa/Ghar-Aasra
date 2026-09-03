import { ShieldCheck, Users, FileCheck2, Headphones } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "Verified listings only",
    body: "Every property is checked for ownership documents and accurate photos before it goes live.",
  },
  {
    icon: Users,
    title: "Agents who respond",
    body: "Average first reply time under 20 minutes, tracked and published on every agent profile.",
  },
  {
    icon: FileCheck2,
    title: "Paperwork handled",
    body: "Contracts, disclosures, and mortgage pre-approval support in one place, not five inboxes.",
  },
  {
    icon: Headphones,
    title: "Support after move-in",
    body: "Our team stays reachable for the first 90 days for anything that comes up post-purchase.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-sand-50 py-16">
      <div className="container-page">
        <h2 className="max-w-md font-display text-2xl text-navy-900 md:text-3xl">
          Buying property shouldn't feel like a leap of faith.
        </h2>

        <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl2 border border-navy-900/8 bg-white p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 text-teal-400">
                <Icon size={18} />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-navy-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-800/60">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
