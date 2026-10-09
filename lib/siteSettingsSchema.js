// Central definition of every admin-managed site setting: what key it's
// stored under (site_settings.setting_key), its default value, and how the
// admin Site Settings page should render/edit it. Adding a new manageable
// setting means adding one entry here — the admin UI, the defaults used on
// the frontend, and the DB fallback all pick it up automatically.
//
// No server-only imports here (no lib/db) so this file is safe to import
// from client components (the admin form, SiteSettingsProvider).

export const FONT_OPTIONS = [
  { value: "classic-serif", label: "Classic serif (Georgia)", stack: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif' },
  { value: "elegant-serif", label: "Elegant serif", stack: '"Playfair Display", Georgia, "Times New Roman", serif' },
  { value: "modern-sans", label: "Modern sans (system)", stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif' },
  { value: "rounded-sans", label: "Rounded sans", stack: '"Nunito Sans", "Segoe UI", Helvetica, Arial, sans-serif' },
  { value: "monospace", label: "Monospace", stack: '"JetBrains Mono", "SFMono-Regular", Consolas, "Courier New", monospace' },
];

export const FONT_SIZE_OPTIONS = [
  { value: "15", label: "Compact (15px)" },
  { value: "16", label: "Default (16px)" },
  { value: "17", label: "Comfortable (17px)" },
  { value: "18", label: "Large (18px)" },
];

export const OVERLAY_OPACITY_OPTIONS = [
  { value: "0", label: "None" },
  { value: "40", label: "Light" },
  { value: "65", label: "Medium" },
  { value: "90", label: "Dark (default)" },
  { value: "100", label: "Very dark" },
];

export const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => {
  const h = i + 6; // 6 AM … 10 PM
  return { value: `${String(h).padStart(2, "0")}:00`, label: `${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}` };
});

export const SLOT_LENGTH_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
];

export const DAYS_AHEAD_OPTIONS = [
  { value: "7", label: "1 week" },
  { value: "14", label: "2 weeks" },
  { value: "21", label: "3 weeks" },
  { value: "30", label: "30 days" },
];

export const POPUP_DELAY_OPTIONS = [
  { value: "15", label: "15 seconds" },
  { value: "30", label: "30 seconds" },
  { value: "45", label: "45 seconds" },
  { value: "60", label: "1 minute" },
];

export function fontStack(value) {
  return FONT_OPTIONS.find((f) => f.value === value)?.stack || FONT_OPTIONS[0].stack;
}

// Homepage sections, in page order. Each gets a show/hide toggle plus an
// editable heading and subheading in the admin "Homepage sections" group.
export const HOME_SECTIONS = [
  { id: "stats", label: "Stats bar", noText: true },
  { id: "categories", label: "Browse by property type", title: "Browse by property type", subtitle: "Jump straight to the kind of place you're picturing." },
  { id: "featured", label: "Featured properties", title: "Featured properties", subtitle: "Hand-picked listings updated daily." },
  { id: "trending", label: "Trending properties", title: "Trending properties", subtitle: "The homes people are viewing right now." },
  { id: "exclusive", label: "Exclusive properties", title: "Exclusive properties", subtitle: "Private-market opportunities, selected just for you." },
  { id: "reels", label: "Property reels", title: "Property reels", subtitle: "Quick video tours. Swipe, like, and book a visit in one tap." },
  { id: "why", label: "Why choose us", title: "Buying property shouldn't feel like a leap of faith.", subtitle: "" },
  { id: "locations", label: "Properties by location", title: "Properties by location", subtitle: "Each city page comes with its own price trends and neighborhood notes." },
  { id: "localities", label: "Popular localities", title: "Explore localities", subtitle: "Average prices, trends and what it's like to live there." },
  { id: "projects", label: "New projects", title: "New projects", subtitle: "Developments open for presale or under construction." },
  { id: "agents", label: "Featured agents", title: "Featured agents", subtitle: "Licensed, reviewed, and quick to reply." },
  { id: "mortgage", label: "Mortgage calculator", title: "Mortgage calculator", subtitle: "Estimate your monthly payment before you tour a place." },
  { id: "testimonials", label: "Testimonials", title: "What clients say", subtitle: "" },
  { id: "news", label: "From the blog", title: "From the blog", subtitle: "Market insight and practical guides, updated weekly." },
  { id: "newsletter", label: "Newsletter banner", title: "New listings, straight to your inbox.", subtitle: "One email a week. No spam, unsubscribe any time." },
];

const WHY_ITEMS = [
  ["Verified listings only", "Every property is checked for ownership documents and accurate photos before it goes live."],
  ["Agents who respond", "Average first reply time under 20 minutes, tracked and published on every agent profile."],
  ["Paperwork handled", "Contracts, disclosures, and mortgage pre-approval support in one place, not five inboxes."],
  ["Support after move-in", "Our team stays reachable for the first 90 days for anything that comes up post-purchase."],
];

const homeSectionFields = HOME_SECTIONS.flatMap((sec) => [
  { key: `home_${sec.id}_enabled`, label: `Show "${sec.label}"`, type: "toggle", default: "true" },
  ...(sec.noText
    ? []
    : [
        { key: `home_${sec.id}_title`, label: `${sec.label} — heading`, type: "text", default: sec.title },
        { key: `home_${sec.id}_subtitle`, label: `${sec.label} — subheading`, type: "text", default: sec.subtitle, placeholder: "Optional" },
      ]),
]);

const whyItemFields = WHY_ITEMS.flatMap(([title, body], i) => [
  { key: `why_item_${i + 1}_title`, label: `Why choose us — point ${i + 1} title`, type: "text", default: title },
  { key: `why_item_${i + 1}_body`, label: `Why choose us — point ${i + 1} text`, type: "textarea", default: body },
]);

export const SETTINGS_GROUPS = [
  {
    key: "branding",
    label: "Branding & general",
    description: "The core identity used across the site's header, footer, and browser tab.",
    fields: [
      { key: "site_title", label: "Site title", type: "text", default: "GharAashra", placeholder: "GharAashra", help: "Your brand name. Used in browser tab titles, emails, and anywhere the site refers to itself." },
      { key: "site_tagline", label: "Tagline", type: "text", default: "Find Your Perfect Property", placeholder: "Find Your Perfect Property" },
      { key: "logo_url", label: "Logo (light backgrounds)", type: "image", default: "/brand/gharaashra-logo.svg", help: "Full logo with name, shown in the header on light pages. Use a transparent PNG. Clear it to go back to the default logo." },
      { key: "logo_dark_url", label: "Logo (dark backgrounds)", type: "image", default: "/brand/gharaashra-logo-light.svg", help: "Light-coloured version shown in the footer and over the homepage hero. Use a transparent PNG." },
      { key: "icon_url", label: "Brand icon", type: "image", default: "/brand/gharaashra-app-icon.png", help: "Square mark (no text) used in the admin panel, sign-in screens, and as the app icon on phones." },
      { key: "favicon_url", label: "Favicon (upload your own)", type: "image", default: "", help: "Square PNG or ICO, at least 48 × 48. Leave empty to use the built-in house icon in the colours below." },
      { key: "favicon_use_theme_colors", label: "Favicon follows theme colours", type: "toggle", default: "true", help: "On: the built-in favicon uses your primary and secondary theme colours. Off: use the two colours below." },
      { key: "favicon_bg_color", label: "Favicon background colour", type: "color", default: "#0f1b2d", help: "Used when 'Favicon follows theme colours' is off." },
      { key: "favicon_icon_color", label: "Favicon icon colour", type: "color", default: "#14b8ac", help: "Used when 'Favicon follows theme colours' is off." },
      { key: "meta_description", label: "Default meta description", type: "textarea", default: "Buy, rent, and invest in homes, apartments, and commercial properties. Search thousands of listings, connect with trusted agents, and explore new projects with GharAashra.", placeholder: "Used for SEO and social sharing previews." },
      { key: "og_image_url", label: "Social share image", type: "image", default: "", help: "Shown when the site is shared on social media (1200×630 recommended)." },
      { key: "currency_symbol", label: "Currency symbol", type: "text", default: "$", placeholder: "$" },
    ],
  },
  {
    key: "theme",
    label: "Theme colors",
    description: "Drives the color palette across the entire frontend — buttons, headers, links, and backgrounds.",
    fields: [
      { key: "primary_color", label: "Primary color", type: "color", default: "#0f1b2d", help: "Header, footer, and dark surfaces." },
      { key: "secondary_color", label: "Secondary / accent color", type: "color", default: "#14b8ac", help: "Buttons, links, and highlights." },
      { key: "accent_color", label: "Tertiary accent color", type: "color", default: "#f2733d", help: "Used sparingly for badges and callouts." },
      { key: "background_color", label: "Page background color", type: "color", default: "#f8f7f4" },
      { key: "text_color", label: "Body text color", type: "color", default: "#16273e" },
    ],
  },
  {
    key: "typography",
    label: "Typography",
    description: "Font style and base sizing used site-wide.",
    fields: [
      { key: "heading_font", label: "Heading font", type: "select", options: FONT_OPTIONS, default: "classic-serif" },
      { key: "body_font", label: "Body font", type: "select", options: FONT_OPTIONS, default: "modern-sans" },
      { key: "base_font_size", label: "Base font size", type: "select", options: FONT_SIZE_OPTIONS, default: "16" },
    ],
  },
  {
    key: "hero",
    label: "Homepage hero",
    description: "The full-width banner at the top of the homepage.",
    fields: [
      {
        key: "hero_media_type",
        label: "Background type",
        type: "select",
        options: [
          { value: "image", label: "Image" },
          { value: "video", label: "Video — upload a file" },
          { value: "youtube", label: "Video — YouTube or Vimeo link" },
        ],
        default: "image",
        help: "What plays behind the homepage search.",
      },
      { key: "hero_banner_image_url", label: "Background image", type: "image", default: "", help: "Wide photo, 1920 × 1080 or larger. With a video, it shows while the video loads and on phones if video is off there.", showIf: { hero_media_type: ["image", "video", "youtube"] } },
      { key: "hero_video_url", label: "Background video file", type: "video", default: "", help: "MP4 (best) or WebM, up to 100 MB. Plays muted on loop. Keep it short (10–30 s) so it loads fast.", showIf: { hero_media_type: ["video"] } },
      { key: "hero_youtube_url", label: "YouTube or Vimeo link", type: "youtube", default: "", placeholder: "https://www.youtube.com/watch?v=…", help: "Paste the video's link. It plays muted on loop with no controls.", showIf: { hero_media_type: ["youtube"] } },
      { key: "hero_video_on_mobile", label: "Play the video on phones", type: "toggle", default: "true", help: "Off: phones show the background image instead, which saves mobile data.", showIf: { hero_media_type: ["video", "youtube"] } },
      { key: "hero_badge_text", label: "Hero badge text", type: "text", default: "12,400+ verified listings across 48 cities", help: "Small pill shown above the hero heading." },
      { key: "hero_heading", label: "Hero heading", type: "text", default: "Find a place that actually fits how you live." },
      { key: "hero_subheading", label: "Hero subheading", type: "textarea", default: "Search apartments, houses, and commercial space with real photos, honest pricing, and agents who answer their phone." },
      { key: "hero_overlay_opacity", label: "Hero overlay darkness", type: "select", options: OVERLAY_OPACITY_OPTIONS, default: "90" },
    ],
  },
  {
    key: "homepage",
    label: "Homepage sections",
    description: "Turn homepage sections on or off and edit their headings. The listings inside them come from your properties automatically.",
    fields: [
      ...homeSectionFields,
      { key: "home_news_count", label: "From the blog — number of articles in the slider", type: "text", default: "8", placeholder: "8" },
      { key: "home_news_autoplay", label: "From the blog — slide automatically", type: "toggle", default: "true" },
    ],
  },
  {
    key: "why_choose_us",
    label: "Why choose us",
    description: "The four selling points shown on the homepage.",
    fields: whyItemFields,
  },
  {
    key: "contact",
    label: "Contact & footer",
    description: "Shown in the site footer and used as the default contact details.",
    fields: [
      { key: "contact_email", label: "Contact email", type: "text", default: "hello@flexhome.com" },
      { key: "contact_phone", label: "Contact phone", type: "text", default: "1-800-062-68" },
      { key: "contact_whatsapp", label: "WhatsApp number", type: "text", default: "", placeholder: "e.g. 15550123456 (no + or spaces)" },
      { key: "contact_address", label: "Office address", type: "text", default: "10 Admiralty Street, Singapore 757695" },
      { key: "footer_about_text", label: "Footer about text", type: "textarea", default: "A real estate portal for buying, renting, and investing with confidence." },
      { key: "footer_copyright_text", label: "Footer copyright text", type: "text", default: "© 2026 GharAashra. All rights reserved." },
    ],
  },
  {
    key: "visits",
    label: "Visit booking",
    description: "Controls the visit scheduler on property pages and the prompts that nudge visitors to book one.",
    fields: [
      { key: "visit_day_start", label: "First slot of the day", type: "select", options: HOUR_OPTIONS, default: "09:00" },
      { key: "visit_day_end", label: "Last slot ends at", type: "select", options: HOUR_OPTIONS, default: "18:00" },
      { key: "visit_slot_minutes", label: "Slot length", type: "select", options: SLOT_LENGTH_OPTIONS, default: "30" },
      { key: "visit_days_ahead", label: "How far ahead visitors can book", type: "select", options: DAYS_AHEAD_OPTIONS, default: "21" },
      { key: "visit_video_enabled", label: "Offer video-call tours", type: "toggle", default: "true", help: "Lets visitors pick a live video walkthrough instead of an in-person visit." },
      { key: "visit_pickup_enabled", label: "Offer pickup for site visits", type: "toggle", default: "false", help: "Shows a \"Need a pickup?\" option. Only turn this on if your team can actually arrange it." },
      { key: "visit_popup_enabled", label: "Show \"book a visit\" popup on property pages", type: "toggle", default: "true", help: "Appears once per browsing session, after the delay below or when the visitor is about to leave." },
      { key: "visit_popup_delay_seconds", label: "Popup delay", type: "select", options: POPUP_DELAY_OPTIONS, default: "30" },
    ],
  },
  {
    key: "social",
    label: "Social links",
    description: "Leave a field empty to hide that icon in the footer.",
    fields: [
      { key: "facebook_url", label: "Facebook URL", type: "text", default: "" },
      { key: "twitter_url", label: "Twitter / X URL", type: "text", default: "" },
      { key: "instagram_url", label: "Instagram URL", type: "text", default: "" },
      { key: "linkedin_url", label: "LinkedIn URL", type: "text", default: "" },
      { key: "youtube_url", label: "YouTube URL", type: "text", default: "" },
    ],
  },
  {
    key: "listings",
    label: "Listings",
    fields: [
      {
        key: "sellers_add_cities",
        label: "Sellers can add new cities",
        type: "toggle",
        default: "true",
        help: "On: when a seller picks a place on the map (or types a city) that isn't in Locations yet, it's added automatically. Off: sellers can only choose from your Locations.",
      },
      {
        key: "commercial_enabled",
        label: "Show commercial properties",
        type: "toggle",
        default: "true",
        help: "Off: commercial listings, offices and shops are hidden everywhere on the public site — menus, search, homepage and their detail pages. They stay safe in the admin panel.",
      },
    ],
  },
  {
    key: "seller_commission",
    label: "Seller commission & payments",
    description: "What sellers pay you. Charges are added to a seller's account automatically; you can change any rate per seller under Sellers. Leave a rate at 0 to not charge for it.",
    fields: [
      { key: "commission_enabled", label: "Charge sellers commission", type: "toggle", default: "true", help: "Off: no new charges are created automatically. Charges you add by hand still work." },
      { key: "commission_per_visit", label: "Per visit", type: "text", default: "0", placeholder: "e.g. 200", help: "Charged when a visit booking on the seller's listing is marked Completed." },
      { key: "commission_per_lead", label: "Per lead", type: "text", default: "0", placeholder: "e.g. 50", help: "Charged when a buyer sends an enquiry or callback request for the seller's listing." },
      { key: "commission_deal_type", label: "Per deal — charge as", type: "select", options: [{ value: "percent", label: "Percentage of the listing price" }, { value: "fixed", label: "Fixed amount per deal" }], default: "percent" },
      { key: "commission_deal_value", label: "Per deal — rate", type: "text", default: "0", placeholder: "e.g. 1 (for 1%) or 5000", help: "Charged when a listing is marked Sold or Rented. You can edit the amount on the charge afterwards." },
      { key: "payment_upi_id", label: "UPI ID for seller payments", type: "text", default: "", placeholder: "yourbusiness@bank" },
      { key: "payment_bank_details", label: "Bank transfer details", type: "textarea", default: "", placeholder: "Account name, account number, IFSC, bank & branch" },
      { key: "payment_instructions", label: "Payment instructions for sellers", type: "textarea", default: "Pay using the UPI ID or bank details below, then enter the transaction reference so our team can confirm your payment." },
    ],
  },
  {
    key: "growth",
    label: "Growth features",
    description: "Ads, alerts, reels and price insights. Manage the content itself under Ads & Banners, Reels, Localities and Buyer Demand.",
    fields: [
      { key: "ads_enabled", label: "Show ads & banners", type: "toggle", default: "true", help: "Master switch for every banner, popup and announcement bar." },
      { key: "ad_popup_delay_seconds", label: "Popup delay (seconds)", type: "text", default: "8", help: "How long after a visitor lands before the popup banner opens. Shown once per visit." },
      { key: "alerts_enabled", label: "Saved searches & price alerts", type: "toggle", default: "true", help: "Lets buyers save searches and get alerts for new matches and price drops." },
      { key: "saved_search_limit", label: "Saved searches per user", type: "text", default: "10" },
      { key: "reels_enabled", label: "Property reels", type: "toggle", default: "true", help: "The /reels video feed and the homepage reels strip." },
      { key: "reels_seller_upload", label: "Sellers can upload reels", type: "toggle", default: "true" },
      { key: "reels_auto_approve", label: "Publish seller reels without review", type: "toggle", default: "false", help: "Off: seller reels wait for your approval under Reels." },
      { key: "fair_price_enabled", label: "Fair price meter on property pages", type: "toggle", default: "true" },
      { key: "fair_price_min_comparables", label: "Minimum similar listings for the price meter", type: "text", default: "3", help: "The meter only appears when there are at least this many comparable listings." },
      { key: "localities_enabled", label: "Locality guide pages", type: "toggle", default: "true" },
    ],
  },
  {
    key: "integrations",
    label: "Integrations",
    fields: [
      { key: "google_analytics_id", label: "Google Analytics ID", type: "text", default: "", placeholder: "G-XXXXXXXXXX" },
    ],
  },
  {
    key: "authentication",
    label: "Account verification",
    description:
      "Controls phone and email sign-in. On: phone login sends a one-time code and email sign-up requires clicking a verification link before the account is active. Off: both skip straight through — no code, no link — so you can test the rest of the flow with zero friction.",
    fields: [
      {
        key: "require_account_verification",
        label: "Require verification",
        type: "toggle",
        default: "false",
        help: "There's no SMS/email provider wired up yet, so while this is on, the code/link is shown right on screen instead of being sent — that's the intended way to test it.",
      },
    ],
  },
];

export const ALL_SETTINGS_FIELDS = SETTINGS_GROUPS.flatMap((g) => g.fields);

export const SETTINGS_DEFAULTS = Object.fromEntries(ALL_SETTINGS_FIELDS.map((f) => [f.key, f.default]));
