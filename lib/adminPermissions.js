// Central role -> permission map for the admin panel.
//
// A role's permission list is a set of "section" keys — one per admin nav
// item / API resource. `null`/`undefined` admin_role (every admin created
// before this feature existed, plus DEMO_ADMIN) and "super_admin" both mean
// full access, so existing admins are unaffected.

export const ADMIN_ROLES = ["super_admin", "hr", "seller", "sales", "marketing"];

export const ADMIN_ROLE_LABELS = {
  super_admin: "Admin (full access)",
  hr: "HR",
  seller: "Seller",
  sales: "Sales",
  marketing: "Marketing",
};

// Every gated admin section. Keys match the admin route segment under
// /admin/<key> (dashboard = the /admin index itself).
export const ADMIN_SECTIONS = [
  "dashboard",
  "properties",
  "categories",
  "subcategories",
  "amenities",
  "carpet-area-presets",
  "floor-plans",
  "projects",
  "locations",
  "agents",
  "developers",
  "blog",
  "faqs",
  "pages",
  "testimonials",
  "stats",
  "home-categories",
  "settings",
  "inquiries",
  "schedule",
  "bookings",
  "sellers",
  "commissions",
  "ads",
  "reels",
  "localities",
  "demand",
  "seller-sizes",
  "staff",
];

const ROLE_SECTIONS = {
  hr: ["dashboard", "agents", "developers"],
  seller: ["dashboard", "properties", "categories", "subcategories", "amenities", "carpet-area-presets", "floor-plans", "seller-sizes", "projects", "locations", "sellers"],
  sales: ["dashboard", "properties", "inquiries", "schedule", "bookings", "agents", "sellers", "commissions", "demand"],
  marketing: ["dashboard", "properties", "blog", "faqs", "pages", "testimonials", "stats", "home-categories", "settings", "ads", "reels", "localities", "demand"],
};

// DB/API resource keys (used by the generic [resource] CRUD route and by
// bespoke routes) that don't match their /admin/<section> URL 1:1.
const RESOURCE_TO_SECTION = {
  carpet_area_presets: "carpet-area-presets",
  visit_requests: "schedule",
  blog_posts: "blog",
  site_stats: "stats",
  home_categories: "home-categories",
};

export function sectionsFor(adminRole) {
  if (!adminRole || adminRole === "super_admin") return null; // null = every section
  return ROLE_SECTIONS[adminRole] || [];
}

export function canAccessSection(adminRole, section) {
  const sections = sectionsFor(adminRole);
  return sections === null || sections.includes(section);
}

export function canAccessResource(adminRole, resourceKey) {
  return canAccessSection(adminRole, RESOURCE_TO_SECTION[resourceKey] || resourceKey);
}
