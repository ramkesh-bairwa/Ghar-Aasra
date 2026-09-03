"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, AlertCircle, Inbox, Eye, Search } from "lucide-react";

function singularize(label) {
  if (/ies$/.test(label)) return label.replace(/ies$/, "y");
  return label.replace(/s$/, "");
}

export default function ResourceManager({ resource, config }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({});
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/${resource}`);
    const data = await res.json();
    if (res.ok) setRows(data.rows);
    else setError(data.error || "Could not load data.");
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  function setFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const filtered = rows.filter((row) => {
    if (!config.filters) return true;
    return config.filters.every((f) => {
      const val = filters[f.key];
      if (!val) return true;
      if (f.type === "search") {
        const q = val.toLowerCase();
        return f.fields.some((field) => String(row[field] ?? "").toLowerCase().includes(q));
      }
      if (f.type === "select") {
        return String(row[f.key] ?? "") === val;
      }
      return true;
    });
  });

  const hasFilters = config.filters?.length > 0;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function clearFilters() { setFilters({}); }

  async function handleSave(formValues) {
    setSaving(true);
    const isNew = !editing.id;
    const res = await fetch(`/api/admin/${resource}${isNew ? "" : `/${editing.id}`}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      load();
    } else {
      alert(data.error || "Save failed.");
    }
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/admin/${resource}/${id}`, { method: "DELETE" });
    setDeleteTarget(null);
    if (res.ok) load();
    else alert("Delete failed.");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-navy-900">{config.label}</h1>
          {!loading && <p className="mt-1 text-sm text-navy-800/55">{rows.length} {rows.length === 1 ? "record" : "records"}</p>}
        </div>
        <button onClick={() => setEditing({})} className="btn-primary">
          <Plus size={16} /> Add {singularize(config.label)}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl2 border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{error}</p>
            <p className="mt-1 text-xs text-coral-700/70">
              Set DB_HOST / DB_USER / DB_PASSWORD in .env and run <code>npm run db:init</code>.
            </p>
          </div>
        </div>
      )}

      {hasFilters && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {config.filters.map((f) => (
            f.type === "search" ? (
              <div key={f.key} className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/35 pointer-events-none" />
                <input
                  type="text"
                  placeholder={f.label}
                  value={filters[f.key] || ""}
                  onChange={(e) => setFilter(f.key, e.target.value)}
                  className="h-9 rounded-xl border border-navy-900/10 bg-white pl-8 pr-3 text-sm text-navy-800 placeholder:text-navy-800/35 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
            ) : (
              <select
                key={f.key}
                value={filters[f.key] || ""}
                onChange={(e) => setFilter(f.key, e.target.value)}
                className="h-9 rounded-xl border border-navy-900/10 bg-white px-3 text-sm text-navy-800 capitalize focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="">{f.label}: All</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>{f.optionLabels?.[o] ?? o.replace(/_/g, " ")}</option>
                ))}
              </select>
            )
          ))}
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-xl border border-navy-900/10 bg-white px-3 text-sm text-navy-800/50 hover:text-coral-600 transition-colors">
              <X size={13} /> Clear
            </button>
          )}
          <span className="ml-auto text-xs text-navy-800/40">
            {filtered.length} of {rows.length}
          </span>
        </div>
      )}

      <div className="card-surface mt-4 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-900/8 text-xs uppercase tracking-wide text-navy-800/40 bg-sand-50">
              {config.listFields.map((f) => (
                <th key={f} className="px-4 py-3 font-medium">{f.replace(/_/g, " ")}</th>
              ))}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-navy-800/40" colSpan={config.listFields.length + 1}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-navy-800/40" colSpan={config.listFields.length + 1}>
                  <Inbox size={22} className="mx-auto mb-2 text-navy-800/20" />
                  No records yet — add your first one.
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-navy-800/40" colSpan={config.listFields.length + 1}>
                  No records match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-b border-navy-900/5 last:border-0 hover:bg-sand-50">
                  {config.listFields.map((f) => (
                    <td key={f} className="max-w-[220px] truncate px-4 py-3 text-navy-800/80">
                      {formatCell(row[f])}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setViewing(row)} title="View" className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4db6c8] text-white hover:opacity-90 transition-opacity">
                        <Eye size={16} />
                      </button>
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

      {viewing && (
        <ViewModal
          config={config}
          row={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setViewing(null); setEditing(viewing); }}
        />
      )}

      {editing && (
        <ResourceFormModal
          config={config}
          initial={editing}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          label={singularize(config.label)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
        />
      )}
    </div>
  );
}

function formatCell(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === 1 || value === 0) return value; // keep numbers as-is, booleans handled above
  return String(value);
}

function ViewModal({ config, row, onClose, onEdit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl2 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-navy-900/8 px-6 py-4">
          <h2 className="font-display text-lg text-navy-900">View {singularize(config.label)}</h2>
          <button onClick={onClose} className="text-navy-800/40 hover:text-navy-900"><X size={18} /></button>
        </div>
        <div className="space-y-3 overflow-y-auto px-6 py-4">
          {config.fields.map((f) => (
            <div key={f.name}>
              <p className="mb-0.5 text-xs font-medium text-navy-800/50">{f.label}</p>
              <p className="rounded-xl border border-navy-900/8 bg-sand-50 px-3 py-2 text-sm text-navy-800/80 break-words">
                {row[f.name] !== null && row[f.name] !== undefined && row[f.name] !== ""
                  ? String(row[f.name])
                  : <span className="text-navy-800/30">—</span>}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-navy-900/8 px-6 py-4">
          <button onClick={onClose} className="btn-outline flex-1">Close</button>
          <button onClick={onEdit} className="btn-primary flex-1">Edit</button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ label, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-xl2 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-navy-900/8 px-6 py-4">
          <h2 className="font-display text-lg text-navy-900">Delete {label}</h2>
          <button onClick={onCancel} className="text-navy-800/40 hover:text-navy-900"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-navy-800/70">Are you sure you want to delete this {label.toLowerCase()}? This action cannot be undone.</p>
          <div className="mt-5 flex gap-2">
            <button onClick={onCancel} className="btn-outline flex-1">Cancel</button>
            <button onClick={onConfirm} className="flex-1 rounded-xl bg-[#e05a4e] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceFormModal({ config, initial, onCancel, onSave, saving }) {
  const [values, setValues] = useState(() => {
    const base = {};
    config.fields.forEach((f) => {
      base[f.name] = initial[f.name] ?? (f.type === "checkbox" ? false : "");
    });
    return base;
  });

  function update(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function submit(e) {
    e.preventDefault();
    onSave(values);
  }

  const isNew = !initial.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl2 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-navy-900/8 px-6 py-4">
          <h2 className="font-display text-lg text-navy-900">
            {isNew ? `Add ${singularize(config.label)}` : `Edit ${singularize(config.label)}`}
          </h2>
          <button onClick={onCancel} className="text-navy-800/40 hover:text-navy-900">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3 overflow-y-auto px-6 py-4">
          {config.fields.map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-xs font-medium text-navy-800/60">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  rows={3}
                  required={f.required}
                  value={values[f.name]}
                  onChange={(e) => update(f.name, e.target.value)}
                  className="w-full rounded-xl border border-navy-900/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              ) : f.type === "select" ? (
                <select
                  required={f.required}
                  value={values[f.name]}
                  onChange={(e) => update(f.name, e.target.value)}
                  className="w-full rounded-xl border border-navy-900/10 px-3 py-2 text-sm capitalize focus:outline-none"
                >
                  <option value="">Select...</option>
                  {f.options.map((o) => (
                    <option key={o} value={o} className="capitalize">{o.replace(/_/g, " ")}</option>
                  ))}
                </select>
              ) : f.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={!!values[f.name]}
                  onChange={(e) => update(f.name, e.target.checked)}
                  className="h-4 w-4 accent-teal-500"
                />
              ) : (
                <input
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  required={f.required}
                  value={values[f.name]}
                  onChange={(e) => update(f.name, e.target.value)}
                  className="w-full rounded-xl border border-navy-900/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              )}
              {f.hint && <p className="mt-1 text-xs text-navy-800/40">{f.hint}</p>}
            </div>
          ))}

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
