// Everything the seller listing wizard needs to render its pickers, loaded
// once on the server: cities, the amenity catalog, the category →
// subcategory tree (the "Flat / Villa / Plot …" type cards) and the floor
// plan master list, which also feeds the quick BHK / size presets. Same
// tables the admin panel manages.

import { query } from "./db";
import { listLocations, isCommercialEnabled } from "./queries";
import { listTypes } from "./floorPlanMaster";

async function safe(sql) {
  try {
    return await query(sql);
  } catch {
    return [];
  }
}

export async function getSellerFormData() {
  const [locations, amenities, categories, subcategories, commercialOn] = await Promise.all([
    listLocations(),
    safe("SELECT id, name, icon_key, category FROM amenities ORDER BY sort_order ASC, id ASC"),
    safe("SELECT id, name, slug FROM categories ORDER BY sort_order ASC, id ASC"),
    safe("SELECT id, category_id, name, slug FROM subcategories ORDER BY sort_order ASC, id ASC"),
    isCommercialEnabled(),
  ]);
  // Floor plan master list (1 BHK, 2 BHK… with sizes) the wizard picks from.
  const floorPlanTypes = await listTypes().catch(() => []);

  // Quick presets per subcategory, from Floor Plans & Sizes (the one place
  // sizes are managed): a size labelled like a subcategory ("Apartment") or
  // under a type named like one ("Office", "Plot") belongs to it.
  const subByName = new Map(subcategories.map((s) => [String(s.name).toLowerCase(), s.id]));
  const presets = floorPlanTypes.flatMap((t) =>
    (t.sizes || []).flatMap((sz) => {
      const subId = subByName.get(String(sz.label || "").toLowerCase()) ?? subByName.get(String(t.name).toLowerCase());
      if (!subId) return [];
      const byType = subByName.get(String(t.name).toLowerCase()) === subId;
      return [{
        id: `${t.id}:${sz.id}`,
        subcategory_id: subId,
        label: byType ? sz.label || t.name : t.name,
        carpet_area_sqm: sz.carpet_area_sqm,
        built_up_area_sqm: sz.built_up_area_sqm,
        bedrooms: t.bedrooms,
      }];
    })
  );

  const tree = categories
    .filter((c) => commercialOn || c.slug !== "commercial")
    .map((c) => ({ ...c, subcategories: subcategories.filter((s) => s.category_id === c.id) }))
    .filter((c) => c.subcategories.length);

  return {
    locations: locations.map((l) => ({ id: l.id, city: l.city, country: l.country })),
    amenities,
    categories: tree,
    presets,
    commercialEnabled: commercialOn,
    floorPlanTypes,
  };
}
