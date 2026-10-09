import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { resources } from "@/lib/adminResources";
import { requireAdmin } from "@/lib/adminGuard";
import { canAccessResource } from "@/lib/adminPermissions";

function getConfig(resource) {
  return resources[resource] || null;
}
function normalize(config, colName, value) {
  const field = config.fields.find((f) => f.name === colName);
  if (field?.type === "checkbox") return value ? 1 : 0;
  if (value === "") return null;
  return value;
}

export async function GET(request, { params }) {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!canAccessResource(admin.admin_role, params.resource)) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  const config = getConfig(params.resource);
  if (!config) return NextResponse.json({ error: "Unknown resource." }, { status: 404 });

  try {
    const rows = await query(`SELECT * FROM ${config.table} WHERE id = ? LIMIT 1`, [params.id]);
    if (!rows.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ row: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: "Could not reach MySQL.", detail: err.message }, { status: 503 });
  }
}

export async function PUT(request, { params }) {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!canAccessResource(admin.admin_role, params.resource)) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  const config = getConfig(params.resource);
  if (!config) return NextResponse.json({ error: "Unknown resource." }, { status: 404 });

  const body = await request.json();
  const allowed = config.fields.map((f) => f.name);
  const cols = allowed.filter((c) => c in body);
  if (!cols.length) return NextResponse.json({ error: "No valid fields submitted." }, { status: 400 });

  let setClause = cols.map((c) => `${c} = ?`).join(", ");
  const values = [...cols.map((c) => normalize(config, c, body[c])), params.id];
  // A schedule request reaches the listing's seller once staff mark it
  // "scheduled" (their approval); setting it back to "new" withdraws it.
  if (params.resource === "visit_requests" && "status" in body) {
    if (body.status === "scheduled") setClause += ", approved_at = COALESCE(approved_at, NOW())";
    if (body.status === "new") setClause += ", approved_at = NULL";
  }

  try {
    await query(`UPDATE ${config.table} SET ${setClause} WHERE id = ?`, values);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Update failed.", detail: err.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!canAccessResource(admin.admin_role, params.resource)) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  const config = getConfig(params.resource);
  if (!config) return NextResponse.json({ error: "Unknown resource." }, { status: 404 });

  try {
    await query(`DELETE FROM ${config.table} WHERE id = ?`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Delete failed.", detail: err.message }, { status: 400 });
  }
}
