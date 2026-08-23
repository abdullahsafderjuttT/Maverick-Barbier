# Maverick Barbier — Website

A single-page site for Maverick Barbier: hero, story, service menu, gallery,
team, and a live booking form wired to Supabase. Plain HTML/CSS/JS — no
build step, no framework.

```
maverick-barbier/
├── index.html
├── css/style.css
├── js/main.js              # nav, tabs, scroll reveals
├── js/supabase-client.js   # booking form → Supabase
├── assets/logo.svg         # green-circle skull logo
├── assets/photos/          # placeholder illustrations — REPLACE with real shop photos
├── supabase/schema.sql     # run this in Supabase once
└── netlify.toml
```

## About the images

I don't have internet access to pull real photographs of your shop, so
every image in `assets/` is a custom SVG illustration I drew — not a stock
photo, not a hotlink. **Before you launch, replace these with real photos**
of your actual space, cuts, and barbers:

| File | Used for |
|---|---|
| `assets/photos/shop-interior.svg` | About section |
| `assets/photos/gallery-1.svg` … `gallery-6.svg` | Gallery grid |
| `assets/photos/team-1.svg`, `team-2.svg`, `team-3.svg` | Barber portraits |
| `assets/dust-badge.svg` | Small glow accent over the About photo — fine to keep as-is |

Just drop in `.jpg`/`.png`/`.webp` files with the **same filenames** (update
the extension in `index.html`'s `src=""` attributes), or swap the filenames
throughout `index.html`. Keep photos roughly square for the gallery grid and
team cards for the cleanest crop. The logo (`assets/logo.svg`) is meant to
stay as-is — it's your mark.

## 1. Push to GitHub

```bash
cd maverick-barbier
git init
git add .
git commit -m "Maverick Barbier site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/maverick-barbier.git
git push -u origin main
```

## 2. Set up Supabase (booking form backend)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run everything in `supabase/schema.sql` —
   this creates the `reservations` table with safe permissions (customers
   can submit a booking, but can't read anyone else's).
3. Go to **Project Settings → API** and copy your **Project URL** and
   **anon public key**.
4. Open `js/supabase-client.js` and paste them in:

   ```js
   const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```

   Commit and push that change. The anon key is meant to be public — it's
   safe to ship in client-side code as long as Row Level Security (from the
   schema file) is on, which it is.
5. To view/manage bookings day-to-day, open the `reservations` table
   straight from the Supabase Table Editor. If you later want an admin
   dashboard, build it as a separate authenticated page — never expose your
   `service_role` key in the browser.

## 3. Deploy on Netlify

**Option A — connect the repo (recommended):**
1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project** → pick your GitHub repo.
2. Build command: leave blank. Publish directory: `.` (repo root).
3. Deploy — Netlify will pick up `netlify.toml` automatically.

**Option B — drag and drop:**
1. Run `git pull`/have the folder locally, then drag the `maverick-barbier`
   folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

Either way, every push to `main` will auto-redeploy once the repo is
connected.

## 4. Customize

- **Colors / fonts**: all in `css/style.css` under the `:root` block at the
  top (`--green-600`, `--emerald-950`, etc.) and the Google Fonts `<link>`
  in `index.html`'s `<head>`.
- **Menu prices, hours, address, team names**: edit directly in
  `index.html` — everything is plain text, no CMS needed.
- **Instagram link**: already points to `instagram.com/maverickmtl` in the
  footer — update if that changes.

## Notes

- The booking form validates on the client and inserts into Supabase; it
  degrades gracefully (shows a clear message instead of failing silently)
  if the Supabase keys haven't been added yet.
- Respects `prefers-reduced-motion` — animations are disabled automatically
  for users who've turned that on at the OS level.
- No analytics or tracking included by default.
