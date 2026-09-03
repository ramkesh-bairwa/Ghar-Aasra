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

export function fontStack(value) {
  return FONT_OPTIONS.find((f) => f.value === value)?.stack || FONT_OPTIONS[0].stack;
}

export const SETTINGS_GROUPS = [
  {
    key: "branding",
    label: "Branding & general",
    description: "The core identity used across the site's header, footer, and browser tab.",
    fields: [
      { key: "site_title", label: "Site title", type: "text", default: "Flex Home", placeholder: "Flex Home" },
      { key: "site_tagline", label: "Tagline", type: "text", default: "Find Your Perfect Property", placeholder: "Find Your Perfect Property" },
      { key: "logo_url", label: "Logo", type: "image", default: "", help: "Shown in the header and footer. Leave empty to use the default icon mark." },
      { key: "favicon_url", label: "Favicon", type: "image", default: "", help: "Small square image (PNG/ICO) shown in the browser tab." },
      { key: "meta_description", label: "Default meta description", type: "textarea", default: "Buy, rent, and invest in homes, apartments, and commercial properties. Search thousands of listings, connect with trusted agents, and explore new projects with Flex Home.", placeholder: "Used for SEO and social sharing previews." },
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
      { key: "hero_video_url", label: "Hero video", type: "video", default: "", help: "MP4/WebM/Ogg/MOV, max 100MB. Takes priority over the banner image below." },
      { key: "hero_banner_image_url", label: "Hero banner image", type: "image", default: "", help: "Shown when no hero video is set." },
      { key: "hero_heading", label: "Hero heading", type: "text", default: "Find a place that actually fits how you live." },
      { key: "hero_subheading", label: "Hero subheading", type: "textarea", default: "Search apartments, houses, and commercial space with real photos, honest pricing, and agents who answer their phone." },
      { key: "hero_overlay_opacity", label: "Hero overlay darkness", type: "select", options: OVERLAY_OPACITY_OPTIONS, default: "90" },
    ],
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
      { key: "footer_copyright_text", label: "Footer copyright text", type: "text", default: "© 2026 Flex Home. All rights reserved." },
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
