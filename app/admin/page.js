"use client";

import AdminGate from "@/components/admin/AdminGate";
import { useEffect, useState } from "react";
import { Building2, Layers, Users, Briefcase, Newspaper, HelpCircle, Inbox, AlertCircle, CalendarCheck, Clock, PhoneCall, CalendarClock, Video } from "lucide-react";
import { formatSlotLabel, dateKey } from "@/lib/visitSlots";

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
    fetch(`/api/admin/dashboard?today=${dateKey(new Date())}`)
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

      {data?.visits && <VisitsPanel visits={data.visits} />}

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
                  <div className="text-xs text-navy-800/50">{i.source === "callback" ? `Callback · ${i.phone || ""}` : i.email}</div>
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

function VisitsPanel({ visits }) {
  const conversion = visits.leads30 > 0 ? Math.round((visits.booked30 / visits.leads30) * 100) : null;
  const tiles = [
    { label: "Visits today", value: visits.today, icon: CalendarCheck, href: "/admin/bookings" },
    { label: "Waiting for confirmation", value: visits.pending, icon: Clock, href: "/admin/bookings", alert: visits.pending > 0 },
    { label: "Callbacks to make", value: visits.callbacks, icon: PhoneCall, href: "/admin/inquiries", alert: visits.callbacks > 0 },
    { label: "New schedule requests", value: visits.newRequests, icon: CalendarClock, href: "/admin/schedule", alert: visits.newRequests > 0 },
  ];

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, href, alert }) => (
          <a key={label} href={href} className={`card-surface flex items-center gap-4 p-5 hover:shadow-card ${alert ? "ring-2 ring-amber-500/40" : ""}`}>
            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${alert ? "bg-amber-500/15 text-amber-700" : "bg-teal-500/10 text-teal-600"}`}>
              <Icon size={18} />
            </span>
            <div>
              <div className="font-display text-2xl text-navy-900">{value}</div>
              <div className="text-xs text-navy-800/50">{label}</div>
            </div>
          </a>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,1.4fr]">
        <div className="card-surface p-5">
          <h2 className="font-display text-lg text-navy-900">Last 30 days</h2>
          <div className="mt-4 space-y-3 text-sm">
            <FunnelRow label="Enquiries & callbacks" value={visits.leads30} />
            <FunnelRow label="Visits booked" value={visits.booked30} />
            <FunnelRow label="Visits completed" value={visits.completed30} />
          </div>
          {conversion !== null && (
            <p className="mt-4 rounded-lg bg-sand-100 px-3 py-2 text-xs text-navy-800/65">
              Roughly <span className="font-semibold text-navy-900">{conversion}</span> visits booked for every 100 enquiries.
            </p>
          )}
        </div>

        <div className="card-surface p-5">
          <h2 className="font-display text-lg text-navy-900">Today&apos;s visits</h2>
          {visits.todayList.length === 0 ? (
            <p className="mt-3 text-sm text-navy-800/50">No visits scheduled for today.</p>
          ) : (
            <div className="mt-3 divide-y divide-navy-900/8">
              {visits.todayList.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium text-navy-900">
                      {formatSlotLabel(v.scheduled_at.slice(11, 16))} · {v.customer_name}
                      {v.visit_type === "video" && <Video size={13} className="ml-1.5 inline text-navy-800/50" />}
                    </div>
                    <div className="truncate text-xs text-navy-800/50">{v.property_title}</div>
                  </div>
                  {v.customer_phone && (
                    <a href={`tel:${v.customer_phone.replace(/[^\d+]/g, "")}`} className="shrink-0 text-xs font-semibold text-teal-600">
                      {v.customer_phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FunnelRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-navy-800/60">{label}</span>
      <span className="font-display text-lg text-navy-900">{value}</span>
    </div>
  );
}
