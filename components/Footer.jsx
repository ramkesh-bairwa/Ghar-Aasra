import { Home, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";
import { getAllSiteSettings } from "@/lib/queries";

const columns = [
  {
    heading: "Explore",
    links: [
      { label: "Buy properties", href: "/buy" },
      { label: "Rent properties", href: "/rent" },
      { label: "Commercial", href: "/commercial" },
      { label: "New projects", href: "/projects" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Agents", href: "/agents" },
      { label: "Careers", href: "/careers" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Blog / News", href: "/blog" },
      { label: "FAQ", href: "/faq" },
      { label: "Mortgage calculator", href: "/#mortgage" },
      { label: "Properties by location", href: "/locations" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms & conditions", href: "/terms" },
    ],
  },
];

export default async function Footer() {
  const settings = await getAllSiteSettings();

  const socialLinks = [
    { icon: Facebook, href: settings.facebook_url },
    { icon: Twitter, href: settings.twitter_url },
    { icon: Instagram, href: settings.instagram_url },
    { icon: Linkedin, href: settings.linkedin_url },
    { icon: Youtube, href: settings.youtube_url },
  ].filter((s) => s.href);

  return (
    <footer className="bg-navy-950 pt-16 text-white/70">
      <div className="container-page grid gap-10 pb-12 lg:grid-cols-[1.4fr,1fr,1fr,1fr,1fr]">
        <div>
          <a href="/" className="flex items-center gap-2">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.site_title} className="h-9 w-auto object-contain" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 text-navy-950">
                <Home size={18} strokeWidth={2.4} />
              </span>
            )}
            <span className="font-display text-xl text-white">{settings.site_title}</span>
          </a>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">{settings.footer_about_text}</p>
          <div className="mt-5 space-y-2 text-sm">
            {settings.contact_address && (
              <p className="flex items-center gap-2 text-white/60">
                <MapPin size={14} /> {settings.contact_address}
              </p>
            )}
            {settings.contact_phone && (
              <p className="flex items-center gap-2 text-white/60">
                <Phone size={14} /> {settings.contact_phone}
              </p>
            )}
            {settings.contact_email && (
              <p className="flex items-center gap-2 text-white/60">
                <Mail size={14} /> {settings.contact_email}
              </p>
            )}
          </div>
          {socialLinks.length > 0 && (
            <div className="mt-5 flex gap-3">
              {socialLinks.map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-teal-500 hover:text-navy-950"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          )}
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <h3 className="text-sm font-semibold text-white">{col.heading}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-white/55 hover:text-teal-400">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 py-6">
        <div className="container-page flex flex-col items-center justify-between gap-3 text-xs text-white/40 sm:flex-row">
          <span>{settings.footer_copyright_text}</span>
          <span>Built with Next.js &amp; MySQL</span>
        </div>
      </div>
    </footer>
  );
}
