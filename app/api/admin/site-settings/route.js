import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { invalidateSiteSettingsCache } from "@/lib/queries";
import { ALL_SETTINGS_FIELDS } from "@/lib/siteSettingsSchema";

const VALID_KEYS = new Set(ALL_SETTINGS_FIELDS.map((f) => f.key));

export async function GET() {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  try {
    const rows = await query("SELECT setting_key, setting_value FROM site_settings");
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ rows: [], error: err.message }, { status: 200 });
  }
}

async function upsertSetting(key, value) {
  await query(
    `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [key, value ?? null]
  );
}

// Accepts either a single { key, value } (used by one-off uploads, e.g. the
// hero video) or a bulk { settings: { key: value, ... } } save from the
// admin Site Settings form.
export async function PUT(request) {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json();

  try {
    if (body.settings && typeof body.settings === "object") {
      const entries = Object.entries(body.settings).filter(([key]) => VALID_KEYS.has(key));
      if (!entries.length) return NextResponse.json({ error: "No valid settings provided." }, { status: 400 });
      for (const [key, value] of entries) {
        await upsertSetting(key, value);
      }
    } else {
      const { key, value } = body;
      if (!key) return NextResponse.json({ error: "Missing key." }, { status: 400 });
      await upsertSetting(key, value);
    }
    invalidateSiteSettingsCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Save failed.", detail: err.message }, { status: 400 });
  }
}
