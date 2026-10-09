"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import StudioShell from "./StudioShell";
import StudioOverview from "./StudioOverview";
import VendorListings from "./VendorListings";
import VendorLeads from "./VendorLeads";
import VendorPerformance from "./VendorPerformance";
import VendorPayments from "./VendorPayments";
import VendorReels from "./VendorReels";
import { LEAD_STAGE, EmptyState } from "./vendorShared";

const VIEWS = [
  { key: "overview", title: "Overview", subtitle: "How your listings are doing at a glance" },
  { key: "listings", title: "My listings", subtitle: "Edit, pause or mark your properties sold" },
  { key: "leads", title: "Leads", subtitle: "Every buyer who enquired or booked a visit" },
  { key: "analytics", title: "Analytics", subtitle: "Compare listings and find quick wins" },
  { key: "reels", title: "Reels", subtitle: "Short video tours of your listings" },
  { key: "payments", title: "Payments", subtitle: "Commission charges, your rates, and paying what's due" },
];

// Full-screen seller app: sidebar navigation + a view area. All data comes
// from /api/vendor/overview; listing/lead mutations update it optimistically.
export default function SellerStudio() {
  const { user } = useAuth();
  const { currency_symbol: symbol = "$" } = useSiteSettings();
  const [view, setView] = useState("overview");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [savingLeadId, setSavingLeadId] = useState(null);

  // ?view=leads deep links (e.g. from notifications).
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("view");
    if (VIEWS.some((x) => x.key === v)) setView(v);
  }, []);

  function navigate(key) {
    setView(key);
    const url = new URL(window.location.href);
    if (key === "overview") url.searchParams.delete("view");
    else url.searchParams.set("view", key);
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/vendor/overview", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load your dashboard.");
      setData(json);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  async function changeStatus(property, status) {
    setBusyId(property.id);
    setData((d) => ({ ...d, properties: d.properties.map((p) => (p.id === property.id ? { ...p, status } : p)) }));
    const res = await fetch(`/api/vendor/properties/${property.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setNotice("Couldn't update that listing's status.");
      await load();
    } else {
      setNotice("Listing status updated.");
    }
    setBusyId(null);
  }

  async function remove(property) {
    setBusyId(property.id);
    const res = await fetch(`/api/vendor/properties/${property.id}`, { method: "DELETE" });
    if (res.ok) {
      setData((d) => ({
        ...d,
        properties: d.properties.filter((p) => p.id !== property.id),
        leads: d.leads.filter((l) => l.propertyId !== property.id),
      }));
      setNotice(`"${property.title}" was deleted.`);
    } else {
      setNotice("Couldn't delete that listing.");
    }
    setBusyId(null);
  }

  async function changeLeadStatus(lead, status) {
    const previous = lead.status;
    setSavingLeadId(lead.id);
    setData((d) => ({ ...d, leads: d.leads.map((l) => (l.id === lead.id ? { ...l, status } : l)) }));
    try {
      const res = await fetch(`/api/vendor/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setData((d) => ({ ...d, leads: d.leads.map((l) => (l.id === lead.id ? { ...l, status: previous } : l)) }));
      setNotice("Couldn't update the lead status — please try again.");
    }
    setSavingLeadId(null);
  }

  const properties = data?.properties || [];
  const leads = data?.leads || [];
  const newLeads = leads.filter((l) => (LEAD_STAGE[l.status] || "new") === "new").length;
  const counts = { listings: properties.length, leads: newLeads, payments: data?.unpaidCharges || 0 };
  const current = VIEWS.find((v) => v.key === view);

  return (
    <StudioShell active={view} title={current.title} subtitle={current.subtitle} counts={counts} onNavigate={navigate}>

          {error ? (
            <div className="flex items-center gap-2 rounded-2xl bg-coral-500/10 p-4 text-sm text-coral-600">
              <AlertCircle size={16} /> {error}
              <button type="button" onClick={load} className="ml-auto font-semibold underline">Retry</button>
            </div>
          ) : !data ? (
            <div className="space-y-6">
              <div className="h-56 animate-pulse rounded-[2rem] bg-white/80" />
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-3xl bg-white/80" />)}
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-navy-800/50">
                <Loader2 size={16} className="animate-spin" /> Loading your studio…
              </div>
            </div>
          ) : view === "overview" ? (
            <StudioOverview user={user} properties={properties} leads={leads} symbol={symbol} onNavigate={navigate} />
          ) : view === "listings" ? (
            properties.length ? (
              <VendorListings properties={properties} symbol={symbol} busyId={busyId} onStatus={changeStatus} onDelete={remove} />
            ) : (
              <EmptyState Icon={Building2} title="No listings yet" text="List your first property in a few minutes. It's free, and buyers can book visits right away.">
                <Link href="/vendor/new" className="btn-primary mt-6"><Plus size={16} /> Add a property</Link>
              </EmptyState>
            )
          ) : view === "leads" ? (
            <VendorLeads leads={leads} savingId={savingLeadId} onStatus={changeLeadStatus} />
          ) : view === "reels" ? (
            <VendorReels properties={properties} />
          ) : view === "payments" ? (
            <VendorPayments symbol={symbol} />
          ) : (
            <VendorPerformance properties={properties} />
          )}

      {notice && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-navy-950 px-5 py-3 text-sm font-medium text-white shadow-card lg:left-[calc(50%+9rem)]">
          <Sparkles size={15} className="text-teal-300" /> {notice}
        </div>
      )}
    </StudioShell>
  );
}
