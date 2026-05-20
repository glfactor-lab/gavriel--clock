# Gavriel Clock PWA

A mobile-first personal time-clock app built with vanilla HTML, CSS, JavaScript, localStorage, and optional Supabase sync.

## Features

- Clock in/out with live shift timer
- Weekly view with daily totals and week navigation
- Monthly view with days worked, longest shift, and earnings estimates
- Editable shift history with optional notes
- Manual shift entry
- Salary-based hourly, daily, weekly, and monthly estimates
- Statistics dashboard with canvas charts
- Calendar view with day-level shift details
- Dark mode
- PWA manifest and service worker for install/offline support
- Local storage fallback by default

## Local Setup

Open `index.html` directly for basic use. For full PWA features, serve it over HTTP:

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173`.

Service workers do not run from `file://` pages, so install/offline behavior needs localhost or a deployed HTTPS site.

## Supabase Setup

1. Create a free project at Supabase.
2. Open SQL Editor and run `supabase-schema.sql`.
3. Enable Email auth in Authentication settings.
4. Add the Supabase browser client script to `index.html` before `supabase.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

5. Add your project URL and anon key in `supabase.js`.
6. Build a small login form or connect auth buttons to `supabase.auth.signInWithOtp`.

## Recommended Folder Structure

```text
/
  index.html
  styles.css
  app.js
  supabase.js
  manifest.webmanifest
  sw.js
  supabase-schema.sql
  assets/
    icon.svg
```

For a larger production app, split `app.js` into `storage.js`, `dates.js`, `charts.js`, `notifications.js`, and `supabase-client.js`.

## Deploy For Free

Use Netlify, Vercel, GitHub Pages, or Cloudflare Pages. Drag the folder into Netlify Drop for the fastest path, or push it to GitHub and connect the repo. Because this is static, no paid server is needed.

## Install As A PWA

iPhone: open the deployed HTTPS site in Safari, tap Share, then Add to Home Screen.

Android: open the site in Chrome, tap the install prompt or the three-dot menu, then Install app.
