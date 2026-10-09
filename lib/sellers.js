// Seller accounts, approval and commission charges — shared by the seller
// panel routes (/api/vendor/*), the listing submit route, and the admin
// Sellers / Commissions screens.

import { query } from "./db";
import { getAllSiteSettings } from "./queries";

export const SELLER_TYPES = ["owner", "agent", "builder"];
export const SELLER_TYPE_LABELS = { owner: "Property owner", agent: "Agent / broker", builder: "Builder / developer" };
export const CHARGE_TYPES = ["visit", "lead", "deal", "other"];
export const CHARGE_STATUSES = ["unpaid", "submitted", "paid", "waived"];
export const PAYMENT_METHODS = ["upi", "bank_transfer", "cash", "cheque", "other"];

// What a seller sees when they can't list yet, keyed by seller_status.
export const SELLER_BLOCK_MESSAGES = {
  none: "Complete your seller profile to start listing properties.",
  pending: "Your seller account is waiting for approval. You can list properties once our team approves it.",
  rejected: "Your seller application wasn't approved. Update your details and apply again.",
  suspended: "Your seller account is suspended. Please contact us to reactivate it.",
};

const PROFILE_COLUMNS =
  "seller_type, business_name, contact_phone, contact_email, address, city, pan_number, gst_number, rera_number, id_proof_url, about, " +
  "commission_per_visit, commission_per_lead, commission_deal_type, commission_deal_value, admin_notes, applied_at";

export async function getSellerAccount(userId) {
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.seller_status, u.seller_created_by_admin, u.seller_approved_at,
       u.seller_rejection_reason, ${PROFILE_COLUMNS.split(", ").map((c) => `sp.${c}`).join(", ")}
     FROM users u LEFT JOIN seller_profiles sp ON sp.user_id = u.id
     WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// { account } when the user is an approved seller, else { status, message }.
export async function checkApprovedSeller(userId) {
  const account = await getSellerAccount(userId);
  const status = account?.seller_status || "none";
  if (status === "approved") return { account };
  return { status, message: SELLER_BLOCK_MESSAGES[status] || SELLER_BLOCK_MESSAGES.none };
}

// ---------- Seller profile validation (application form + admin form) ----------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s-]{7,20}$/;
const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;
const GST_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;

const clean = (v, max) => {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
};
const safeUpload = (v) => {
  const s = String(v || "").trim();
  return /^\/uploads\/[\w./-]+$/.test(s) || /^https?:\/\//i.test(s) ? s.slice(0, 500) : null;
};

// Returns { fieldErrors } or { row } for seller_profiles. `requireKyc`
// enforces the details a self-registering seller must provide; admins
// creating a seller can leave them for later.
export function validateSellerProfile(body, { requireKyc = true } = {}) {
  const e = {};
  const row = {
    seller_type: SELLER_TYPES.includes(body.seller_type) ? body.seller_type : null,
    business_name: clean(body.business_name, 160),
    contact_phone: clean(body.contact_phone, 30),
    contact_email: clean(body.contact_email, 160),
    address: clean(body.address, 255),
    city: clean(body.city, 120),
    pan_number: clean(body.pan_number, 20)?.toUpperCase() || null,
    gst_number: clean(body.gst_number, 20)?.toUpperCase() || null,
    rera_number: clean(body.rera_number, 100),
    id_proof_url: safeUpload(body.id_proof_url),
    about: clean(body.about, 2000),
  };

  if (!row.seller_type) e.seller_type = "Choose whether you're an owner, agent or builder.";
  if (row.seller_type && row.seller_type !== "owner" && !row.business_name) {
    e.business_name = row.seller_type === "agent" ? "Enter your agency name." : "Enter your company name.";
  }
  if (requireKyc && !row.contact_phone) e.contact_phone = "Enter a phone number buyers and our team can reach you on.";
  else if (row.contact_phone && !PHONE_RE.test(row.contact_phone)) e.contact_phone = "Enter a valid phone number (digits only, 7–20 long).";
  if (row.contact_email && !EMAIL_RE.test(row.contact_email)) e.contact_email = "Enter a valid email address, like name@example.com.";
  if (requireKyc && !row.city) e.city = "Enter the city you operate in.";
  if (requireKyc && !row.address) e.address = "Enter your address.";
  if (requireKyc && !row.pan_number) e.pan_number = "Enter your PAN number. It's needed to verify sellers.";
  else if (row.pan_number && !PAN_RE.test(row.pan_number)) e.pan_number = "PAN should look like ABCDE1234F (5 letters, 4 digits, 1 letter).";
  if (row.gst_number && !GST_RE.test(row.gst_number)) e.gst_number = "GST number should be 15 characters, like 22ABCDE1234F1Z5.";
  if (requireKyc && row.seller_type === "builder" && !row.rera_number) e.rera_number = "Builders need a RERA registration number.";
  if (requireKyc && !row.id_proof_url) e.id_proof_url = "Upload an ID proof (Aadhaar, PAN card, passport or business registration).";
  if (body.accept_terms !== undefined && !body.accept_terms) e.accept_terms = "Please accept the seller terms and commission policy.";

  return Object.keys(e).length ? { fieldErrors: e } : { row };
}

// Admin-only commission overrides. Blank = use the site-wide rate.
export function cleanCommissionOverrides(body) {
  const e = {};
  const money = (key) => {
    const v = body[key];
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) {
      e[key] = "Enter a number of 0 or more, or leave it blank to use the default rate.";
      return null;
    }
    return n;
  };
  const row = {
    commission_per_visit: money("commission_per_visit"),
    commission_per_lead: money("commission_per_lead"),
    commission_deal_type: ["percent", "fixed"].includes(body.commission_deal_type) ? body.commission_deal_type : null,
    commission_deal_value: money("commission_deal_value"),
  };
  if (row.commission_deal_type === "percent" && row.commission_deal_value > 100) {
    e.commission_deal_value = "A percentage can't be more than 100.";
  }
  return Object.keys(e).length ? { fieldErrors: e } : { row };
}

export async function saveSellerProfile(userId, row) {
  const cols = Object.keys(row);
  await query(
    `INSERT INTO seller_profiles (user_id, ${cols.join(", ")}) VALUES (?, ${cols.map(() => "?").join(", ")})
     ON DUPLICATE KEY UPDATE ${cols.map((c) => `${c} = VALUES(${c})`).join(", ")}`,
    [userId, ...cols.map((c) => row[c])]
  );
}

// ---------- Commission ----------

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// The rates that apply to one seller: their own override where set,
// otherwise the site-wide rate from Site Settings.
export async function getCommissionRates(userId, account = null) {
  const settings = await getAllSiteSettings();
  const a = account || (await getSellerAccount(userId)) || {};
  const pick = (own, global) => (own !== null && own !== undefined ? toNum(own) : toNum(global));
  return {
    enabled: settings.commission_enabled !== "false",
    visit: pick(a.commission_per_visit, settings.commission_per_visit),
    lead: pick(a.commission_per_lead, settings.commission_per_lead),
    dealType: a.commission_deal_type || settings.commission_deal_type || "percent",
    dealValue: pick(a.commission_deal_value, settings.commission_deal_value),
    custom: {
      visit: a.commission_per_visit != null,
      lead: a.commission_per_lead != null,
      deal: a.commission_deal_value != null || a.commission_deal_type != null,
    },
  };
}

export function dealAmount(rates, dealValue) {
  if (rates.dealType === "fixed") return rates.dealValue;
  return Math.round((toNum(dealValue) * rates.dealValue) / 100 * 100) / 100;
}

// Adds the automatic charge for an event on a seller's listing. Safe to call
// more than once for the same event (unique on type + source), and silently
// does nothing for admin-owned listings, a disabled commission or a 0 rate.
// Never throws — a failed charge must not break the buyer's action.
export async function addAutoCharge({ type, sourceType, sourceId, propertyId }) {
  try {
    const [property] = await query(
      "SELECT id, title, owner_user_id, price, listing_type, price_period FROM properties WHERE id = ? LIMIT 1",
      [propertyId]
    );
    if (!property?.owner_user_id) return;
    const rates = await getCommissionRates(property.owner_user_id);
    if (!rates.enabled) return;

    let amount = 0;
    let description = "";
    let dealValue = null;
    if (type === "visit") {
      amount = rates.visit;
      description = `Completed visit · ${property.title}`;
    } else if (type === "lead") {
      amount = rates.lead;
      description = `Buyer lead · ${property.title}`;
    } else if (type === "deal") {
      dealValue = Number(property.price) || 0;
      amount = dealAmount(rates, dealValue);
      description = `${property.listing_type === "rent" ? "Rented" : "Sold"} · ${property.title}`;
    }
    if (!(amount > 0)) return;

    await query(
      `INSERT IGNORE INTO seller_charges (seller_user_id, property_id, charge_type, source_type, source_id, description, deal_value, amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [property.owner_user_id, property.id, type, sourceType, sourceId, description.slice(0, 255), dealValue, amount]
    );
  } catch {
    // Commission tables missing (schema not migrated yet) or DB hiccup.
  }
}

export async function getChargeSummary(userId) {
  const rows = await query(
    `SELECT status, COUNT(*) AS n, COALESCE(SUM(amount), 0) AS total FROM seller_charges WHERE seller_user_id = ? GROUP BY status`,
    [userId]
  );
  const by = Object.fromEntries(rows.map((r) => [r.status, { count: Number(r.n), total: Number(r.total) }]));
  const empty = { count: 0, total: 0 };
  return { unpaid: by.unpaid || empty, submitted: by.submitted || empty, paid: by.paid || empty, waived: by.waived || empty };
}
