import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { resources } from "@/lib/adminResources";
import { requireAdmin } from "@/lib/adminGuard";
import { canAccessResource } from "@/lib/adminPermissions";

function getConfig(resource) {
  return resources[resource] || null;
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
    const rows = await query(`SELECT * FROM ${config.table} ORDER BY ${config.orderBy}`);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json(
      { error: "Could not reach MySQL. Check your .env DB_* settings and run `npm run db:init`.", detail: err.message },
      { status: 503 }
    );
  }
}

export async function POST(request, { params }) {
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

  const placeholders = cols.map(() => "?").join(", ");
  const values = cols.map((c) => normalize(config, c, body[c]));

  try {
    const result = await query(
      `INSERT INTO ${config.table} (${cols.join(", ")}) VALUES (${placeholders})`,
      values
    );
    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    return NextResponse.json({ error: "Insert failed.", detail: err.message }, { status: 400 });
  }
}

function normalize(config, colName, value) {
  const field = config.fields.find((f) => f.name === colName);
  if (field?.type === "checkbox") return value ? 1 : 0;
  if (value === "") return null;
  return value;
}
