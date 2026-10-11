# VSCMS — Browser-local edition

VSCMS is a static React + TypeScript workshop-management app. It can be hosted on GitHub Pages; **it does not require MySQL, a Node server, or an API service at runtime**. Records are saved in IndexedDB in the current browser profile.

## Important data scope

- Each browser profile/device has its own separate VSCMS data. GitHub Pages hosts the app files only; it does not receive or synchronize records.
- Clearing site data, using private browsing, changing browsers/devices, or removing the browser profile may remove the records. Use **System information → Export JSON** to keep a backup.
- Importing a JSON backup replaces all VSCMS records currently stored in that browser.
- To delete a single record, select its checkbox in the first table column and use **Delete record**; the configured administrator password is required. Because this is a static browser-only app, the password check is client-side and can be bypassed; it is not a server-side security boundary.
- Tap a table column heading to sort ascending; tap the same heading again to reverse the order. Overview date buttons filter activity metrics and charts: work orders by appointment date, revenue by invoice date, and feedback by feedback date. Today’s schedule and inventory are live snapshots. Revisit Overview or use the top-bar refresh after changing records.
- Existing records from the former MySQL app are **not imported automatically**.
- This review baseline replaces prior VSCMS browser records once when first launched. If an older browser dataset contains records you need to keep, export it from the previous version before opening this one; afterward, normal edits persist in IndexedDB.

## Review dataset

The one-time review baseline contains **200 service-request/work-order history rows**, with exactly **20 in `OPEN` status**, across the six-month period **April 11–October 11, 2026**. Version 4 rebalances the v3 sample once without clearing browser data: it updates only unchanged sample assignments and appointment service/booking fields, preserves user-edited fields and extra records, and leaves subsequent edits alone. Active jobs are spread across the seven `BUSY` mechanics with varied counts; `AVAILABLE` and `ON_LEAVE` mechanics have no active assignments. Historical completions and mechanic bonuses also vary, and service types and booking modes are no longer near-identical counts. Five additional unassigned bookings on October 12–16 keep the upcoming-appointment and new-work-order flows reviewable. Linked customers, vehicles, service lines, parts, invoices and feedback bring the combined total to **933 rows across 11 collections**—the work-order count itself remains 200. Recent completed jobs also keep Today, 7d and 30d revenue and rating metrics populated; inventory includes low-stock, at-reorder and out-of-stock examples. Customer, vehicle, appointment, work-order, service, part, invoice and feedback fields follow the original SQL schema; stock, invoice totals and mechanic bonuses follow the SQL trigger/function rules. All people and contact details are synthetic.

| Collection | Records |
|---|---:|
| Customers | 25 |
| Vehicles | 32 |
| Appointments | 205 |
| Service requests | 200 (**20 open**) |
| Service lines | 140 |
| Mechanics | 10 |
| Spare parts | 16 |
| Part-usage lines | 100 |
| Suppliers | 5 |
| Invoices | 100 |
| Feedback | 100 |
| **Total** | **933** |

## Run locally

Requirements: Node.js 20.19+ and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The startup screen shows the frontend, browser database and review-data initialization before the dashboard opens. The first visit initializes IndexedDB and loads the one-time review baseline. Use **System information → Export JSON** for a backup before clearing site data.

To verify and make a production build:

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Create a GitHub repository and push this folder's contents to its default branch (usually `main`). The `VSCMS/` MySQL server project is not required for this static version.
2. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Push to `main` (or manually run the **Deploy VSCMS to GitHub Pages** workflow from the Actions tab). The workflow builds the app and publishes `dist/`.
4. Wait for the workflow to finish. The deployment URL is shown under **Settings → Pages**.

The Vite configuration automatically uses the repository subpath for project Pages and `/` for a `username.github.io` site. Client-side navigation uses URL hashes so deep links work on static hosting.

## Scripts

- `npm run dev` — Vite development server
- `npm test` — verify one-time baseline replacement, local CRUD, stock usage, invoice/report calculations, and JSON backup restore
- `npm run typecheck` — TypeScript check
- `npm run build` — typecheck and production build
- `npm run preview` — serve the production build locally
