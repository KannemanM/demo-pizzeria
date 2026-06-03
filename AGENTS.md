# AGENTS.md

## Stack
- Pure vanilla HTML/CSS/JS — **no build tools, no bundler, no package.json, no dependencies**.
- Deployed on Vercel (`vercel.json`). Security headers + immutable asset caching (`/assets/(.*)` → 1 year).

## Data
- Menu data source: `menu.csv` (loaded at runtime via `fetch` from `index.html`).
- To point at a Google Sheets CSV instead, change the `data-csv-url` attribute on `#menu-container` in `index.html`. The JS applies 5-min cache busting for `google.com` URLs.
- **Fallback**: `MOCK_MENU_DATA` array in `assets/js/menu.js` is used if CSV fetch fails. Update both `menu.csv` and the mock array when adding items.
- Column `disponible` controls availability: `SI` / `NO` (also accepts `TRUE` / `1`). Unavailable items are hidden.

## Development
- No dev server needed — open `index.html` directly in a browser, or serve with `python3 -m http.server 8080`.
- No lint, typecheck, or test infrastructure exists.

## Conventions
- Language: Spanish (`lang="es"`). All UI text, CSV content, and comments are in Spanish.
- `slugify()` in `menu.js` strips diacritics from category names for URL-safe IDs (e.g. `Pizzas Tradicionales` → `pizzas-tradicionales`).
- Favicon at `/public/favicon.ico`.

## Vercel
- `vercel.json` applies `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, and `Referrer-Policy` headers to all routes.
