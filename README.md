# Flex Home — Real Estate Portal

Next.js 14 (App Router) + Tailwind CSS + MySQL (raw `mysql2`, no ORM), with
a working admin panel. Everything on the public site is driven by the
admin panel's tables — the site falls back to realistic sample data only
where a table is empty or MySQL isn't connected yet, so it looks complete
out of the box and updates live the moment you manage content in `/admin`.

## Pages

**Public:** Home, Property Search / Listing Results, Property Details,
Buy, Rent, Commercial, New Projects (list + detail), Properties by
Location (list + detail), Agents (directory + profile), Developer /
Builder profile, About Us, Contact Us, FAQ, Blog/News (list + detail),
Privacy Policy, Terms & Conditions.

**Admin (`/admin`):** login, dashboard with live counts, and full CRUD for
Properties, New Projects, Agents, Developers, Blog Posts, FAQs, Locations,
Enquiries, plus an editor for the static pages (About/Privacy/Terms).

## Setup

```bash
npm install
cp .env.example .env      # fill in your MySQL credentials
npm run db:init            # creates the flexhome database + tables + seed data
npm run dev                 # http://localhost:3000
```

Admin panel: `http://localhost:3000/admin/login`
Demo login (used automatically until you seed/create your own admin user):
**admin@flexhome.com / admin123**

## How content flows from the admin panel to the site

- `database/schema.sql` — full schema: users, agents, developers,
  properties, property_images, property_features, projects, locations,
  inquiries, favorites, blog_posts, faqs, pages (About/Privacy/Terms).
  Seeds locations, an admin user, and blank static pages.
- `lib/db.js` — `mysql2` connection pool + `query(sql, params)`.
- `lib/queries.js` — every public page calls functions from here
  (`listProperties`, `getPropertyBySlug`, `listAgents`, `listProjects`,
  etc). All content is read from MySQL — there is no static fallback.
  Load the demo content with `npm run db:seed` (from
  `database/seed-data.mjs`), then manage it in `/admin`.
- `lib/adminResources.js` — one config entry per admin-manageable table
  (columns, field types, labels). This drives both the generic CRUD API
  (`app/api/admin/[resource]`) and the generic admin UI
  (`components/admin/ResourceManager.jsx`), so adding a new manageable
  field is a one-line config change, not a new page.

## Try it without MySQL first

The site and admin panel both run immediately with `npm run dev` even
before you touch MySQL — public pages show the built-in sample data, and
the admin panel's dashboard/CRUD screens show a clear "not connected"
message with the exact next step. Once you run `npm run db:init` and add
or edit records in `/admin`, those pages start reflecting your data
automatically — no code changes.

## Notes

- Property/project/blog/location images are set via a plain "image URL"
  field in the admin forms (no file upload yet) — paste any hosted image
  URL.
- Agents/Developers are linked to a `users` row via `user_id` (their name,
  email, phone, and avatar live on the `users` table) — create the person
  under Users in MySQL first, then link their ID in the Agent/Developer
  form. This keeps login credentials and public profile data in one place.
- The mortgage calculator on the homepage is fully client-side (no DB).

## Deploy (server, PM2)

First time: install MySQL + Node 20 + PM2 (`npm i -g pm2`), clone the repo,
create `.env`, then run the steps below and `pm2 start ecosystem.config.js && pm2 save && pm2 startup`.

Every update:

```bash
git pull
npm ci
npm run db:init            # applies schema.sql (safe to re-run)
npm run build
pm2 restart gharaasra
```
