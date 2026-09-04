"use client";

import AdminGate from "@/components/admin/AdminGate";
import { useEffect, useState } from "react";
import { Building2, Layers, Users, Briefcase, Newspaper, HelpCircle, Inbox, AlertCircle } from "lucide-react";

const cards = [
  { key: "properties", label: "Properties", icon: Building2, href: "/admin/properties" },
  { key: "projects", label: "New Projects", icon: Layers, href: "/admin/projects" },
  { key: "agents", label: "Agents", icon: Users, href: "/admin/agents" },
  { key: "developers", label: "Developers", icon: Briefcase, href: "/admin/developers" },
  { key: "blog_posts", label: "Blog Posts", icon: Newspaper, href: "/admin/blog" },
  { key: "faqs", label: "FAQs", icon: HelpCircle, href: "/admin/faqs" },
  { key: "inquiries", label: "Enquiries", icon: Inbox, href: "/admin/inquiries" },
];

export default function AdminDashboardPage() {
  return (
    <AdminGate>
      <DashboardContent />
    </AdminGate>
  );
}

function DashboardContent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ connected: false, counts: {}, recentInquiries: [] }));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-navy-900">Dashboard</h1>
      <p className="mt-1 text-sm text-navy-800/55">Everything below reflects what's live on the public site.</p>

      {data && !data.connected && (
        <div className="mt-4 flex items-start gap-2 rounded-xl2 border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Not connected to MySQL yet</p>
            <p className="mt-1 text-xs text-coral-700/70">
              The public site is showing built-in sample data. Set your DB credentials in .env and run{" "}
              <code>npm run db:init</code>, then add records here — they'll appear on the site immediately.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          const count = data?.counts?.[c.key];
          return (
            <a key={c.key} href={c.href} className="card-surface flex items-center gap-4 p-5 hover:shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
                <Icon size={18} />
              </span>
              <div>
                <div className="font-display text-2xl text-navy-900">{count ?? "—"}</div>
                <div className="text-xs text-navy-800/50">{c.label}</div>
              </div>
            </a>
          );
        })}
      </div>

      <div className="card-surface mt-8 p-5">
        <h2 className="font-display text-lg text-navy-900">Recent enquiries</h2>
        {!data?.recentInquiries?.length ? (
          <p className="mt-3 text-sm text-navy-800/50">No enquiries yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-navy-900/8">
            {data.recentInquiries.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium text-navy-900">{i.name}</div>
                  <div className="text-xs text-navy-800/50">{i.email}</div>
                </div>
                <span className="badge-pill bg-sand-100 text-navy-800/70">{i.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
