"use client";

import AdminGate from "@/components/admin/AdminGate";
import Pagination from "@/components/admin/Pagination";
import { useEffect, useState } from "react";
import { Plus, Pencil, X, AlertCircle, Inbox, ShieldAlert } from "lucide-react";
import { TableSkeletonRows } from "@/components/admin/AdminSkeleton";
import { useDialog } from "@/components/ConfirmDialog";

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Admin (full access)" },
  { value: "hr", label: "HR" },
  { value: "seller", label: "Seller" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
];

const ROLE_LABELS = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.label]));

const ROLE_BADGE = {
  super_admin: "bg-navy-900/8 text-navy-800/70",
  hr: "bg-purple-500/15 text-purple-700",
  seller: "bg-teal-500/15 text-teal-700",
  sales: "bg-amber-500/15 text-amber-700",
  marketing: "bg-coral-500/15 text-coral-700",
};

export default function AdminStaffPage() {
  return (
    <AdminGate>
      <StaffManager />
    </AdminGate>
  );
}

function StaffManager() {
  const { alert: notify, dialog } = useDialog();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function load() {
    setLoading(true);
    setError("");
    setForbidden(false);
    const res = await fetch("/api/admin/staff");
    if (res.status === 403) { setForbidden(true); setLoading(false); return; }
    const data = await res.json();
    if (res.ok) setRows(data.rows);
    else setError(data.error || "Could not load staff accounts.");
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave(values) {
    setSaving(true);
    const isNew = !editing.id;
    const res = await fetch(`/api/admin/staff${isNew ? "" : `/${editing.id}`}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setEditing(null); load(); }
    else notify({ title: "Save failed", message: data.error || "Save failed.", tone: "danger" });
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setDeleteTarget(null);
    if (res.ok) load();
    else notify({ title: "Delete failed", message: data.error || "Delete failed.", tone: "danger" });
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl2 border border-navy-900/10 bg-white px-6 py-16 text-center">
        <ShieldAlert size={28} className="mb-3 text-navy-800/30" />
        <p className="font-medium text-navy-900">Only full admins can manage staff accounts.</p>
        <p className="mt-1 text-sm text-navy-800/50">Ask an admin to grant you access if you need it.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Staff</h1>
          {!loading && <p className="mt-1 text-sm text-navy-800/55">{rows.length} {rows.length === 1 ? "account" : "accounts"}</p>}
        </div>
        <button onClick={() => setEditing({})} className="btn-primary">
          <Plus size={16} /> Add staff
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl2 border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="card-surface mt-4 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-900/8 text-xs uppercase tracking-wide text-navy-800/40 bg-sand-50">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows cols={5} />
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-navy-800/40" colSpan={5}>
                  <Inbox size={22} className="mx-auto mb-2 text-navy-800/20" />
                  No staff accounts yet — add your first one.
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id} className="border-b border-navy-900/5 last:border-0 hover:bg-sand-50">
                  <td className="px-4 py-3 font-medium text-navy-900">{row.name}</td>
                  <td className="px-4 py-3 text-navy-800/70">{row.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge-pill ${ROLE_BADGE[row.admin_role] || ROLE_BADGE.super_admin}`}>
                      {ROLE_LABELS[row.admin_role] || "Admin (full access)"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-800/70 capitalize">{row.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setEditing(row)} title="Edit" className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5cb85c] text-white hover:opacity-90 transition-opacity">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setDeleteTarget(row)} title="Delete" className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e05a4e] text-white hover:opacity-90 transition-opacity">
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={safePage}
        pageCount={pageCount}
        pageSize={pageSize}
        total={rows.length}
        onPageChange={setPage}
        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
      />

      {editing && (
        <StaffFormModal
          initial={editing}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-xl2 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-navy-900/8 px-6 py-4">
              <h2 className="font-display text-lg text-navy-900">Delete Staff Account</h2>
              <button onClick={() => setDeleteTarget(null)} className="text-navy-800/40 hover:text-navy-900"><X size={18} /></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-navy-800/70">
                Are you sure you want to delete <span className="font-medium text-navy-900">{deleteTarget.name}</span>? This cannot be undone.
              </p>
              <div className="mt-5 flex gap-2">
                <button onClick={() => setDeleteTarget(null)} className="btn-outline flex-1">Cancel</button>
                <button onClick={() => handleDelete(deleteTarget.id)}
                  className="flex-1 rounded-xl bg-[#e05a4e] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}

function StaffFormModal({ initial, saving, onCancel, onSave }) {
  const isNew = !initial.id;
  const [name, setName] = useState(initial.name || "");
  const [email, setEmail] = useState(initial.email || "");
  const [password, setPassword] = useState("");
  const [adminRole, setAdminRole] = useState(initial.admin_role || "seller");
  const [status, setStatus] = useState(initial.status || "active");

  function submit(e) {
    e.preventDefault();
    const values = { name, email, admin_role: adminRole, status };
    if (isNew || password) values.password = password;
    onSave(values);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl2 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-navy-900/8 px-6 py-4">
          <h2 className="font-display text-lg text-navy-900">{isNew ? "Add Staff" : "Edit Staff"}</h2>
          <button onClick={onCancel} className="text-navy-800/40 hover:text-navy-900"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-3 overflow-y-auto px-6 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800/60">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-navy-900/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800/60">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-navy-900/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800/60">
              Password {!isNew && <span className="text-navy-800/40">(leave blank to keep current)</span>}
            </label>
            <input type="password" required={isNew} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-navy-900/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800/60">Role</label>
            <select value={adminRole} onChange={(e) => setAdminRole(e.target.value)}
              className="w-full rounded-xl border border-navy-900/10 px-3 py-2 text-sm focus:outline-none">
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <p className="mt-1 text-xs text-navy-800/40">Controls which admin sections this account can see and edit.</p>
          </div>
          {!isNew && (
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-800/60">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-navy-900/10 px-3 py-2 text-sm focus:outline-none">
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onCancel} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
