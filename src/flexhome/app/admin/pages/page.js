"use client";

import AdminGate from "@/components/admin/AdminGate";
import { useEffect, useState } from "react";

const slugs = [
  { slug: "about-us", label: "About Us" },
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "terms", label: "Terms & Conditions" },
];

export default function AdminPagesPage() {
  return (
    <AdminGate>
      <StaticPagesEditor />
    </AdminGate>
  );
}

function StaticPagesEditor() {
  const [active, setActive] = useState("about-us");
  const [rows, setRows] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/pages_lookup")
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d) => setRows(d.rows || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const row = rows.find((r) => r.slug === active);
    setTitle(row?.title || slugs.find((s) => s.slug === active)?.label || "");
    setContent(row?.content || "");
  }, [active, rows]);

  async function save() {
    setSaving(true);
    setSavedMsg("");
    const res = await fetch("/api/admin/pages_lookup", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: active, title, content }),
    });
    setSaving(false);
    setSavedMsg(res.ok ? "Saved." : "Could not save — check your MySQL connection.");
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-navy-900">Static Pages</h1>
      <p className="mt-1 text-sm text-navy-800/55">Edit the content shown on About Us, Privacy Policy, and Terms & Conditions.</p>

      <div className="mt-6 flex gap-2">
        {slugs.map((s) => (
          <button
            key={s.slug}
            onClick={() => setActive(s.slug)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              active === s.slug ? "bg-navy-900 text-white" : "bg-white text-navy-800/60 ring-1 ring-navy-900/10"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="card-surface mt-4 space-y-3 p-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-navy-800/60">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-navy-900/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy-800/60">Content</label>
          <textarea
            rows={14}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-xl border border-navy-900/10 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save page"}
          </button>
          {savedMsg && <span className="text-xs text-navy-800/50">{savedMsg}</span>}
        </div>
      </div>
    </div>
  );
}
