// Banner placements (pure data, safe to import from client components).
// Where a banner can appear. `size` is the recommended upload, shown in the admin form.
export const AD_PLACEMENTS = [
  { key: "announcement_bar", label: "Top announcement bar", hint: "Thin strip above the header on every page. Text + link only.", size: "Text only", textOnly: true },
  { key: "home_hero_below", label: "Homepage — below the search", hint: "Wide banner right under the hero. Several banners rotate as a slider.", size: "1600 × 400 image or 16:4 video" },
  { key: "home_middle", label: "Homepage — between sections", hint: "Wide banner in the middle of the homepage.", size: "1600 × 400 image or video" },
  { key: "listing_top", label: "Search results — top", hint: "Above the property results on Buy / Rent / Search pages.", size: "1600 × 300 image or video" },
  { key: "listing_inline", label: "Search results — between listings", hint: "Shown as a card after the 6th property. Looks like a listing card.", size: "800 × 600 image or video" },
  { key: "property_sidebar", label: "Property page — sidebar", hint: "Next to the enquiry form on every property page.", size: "600 × 750 image or vertical video" },
  { key: "property_bottom", label: "Property page — below details", hint: "Wide banner under the property details.", size: "1600 × 400 image or video" },
  { key: "popup", label: "Popup", hint: "Opens once per visit after a few seconds. Great for offers.", size: "800 × 800 image or video" },
];
export const AD_PLACEMENT_KEYS = AD_PLACEMENTS.map((p) => p.key);

