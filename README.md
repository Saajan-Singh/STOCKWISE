StockWise

Demand-based inventory reorder intelligence for small businesses.

StockWise tells small business owners exactly what to reorder and when — not with a static "low stock" alert, but by calculating a real reorder point from actual sales history using industry-standard inventory formulas.

Table of Contents
The Problem
Who This Is For
How It Works
The Formulas
Tech Stack
Project Structure
Data Model
Running Locally
Live Demo
Known Limitations (Phase 1)
Phase 2 Roadmap
Future Phases (3+)
The Problem

Small businesses lose money two ways:

Stockouts — running out of a popular item and losing the sale.
Overstock — over-ordering a slow-moving item and tying up cash in dead inventory.

Both problems come from the same root cause: guessing instead of calculating. Most affordable inventory tools use a flat, static threshold — "alert me when stock drops below 10 units" — regardless of how fast that specific item actually sells or how long it takes to restock. Enterprise tools like SAP or NetSuite solve this properly, but they're built for large warehouses with dedicated staff, not a single shop owner.

StockWise brings real demand-based reorder logic down to a scale a small business can actually use.

Who This Is For:
Small business owners currently tracking stock manually — in their head or in a spreadsheet — who only discover they're out of something when a customer asks for it. Examples: retail and apparel shops, cafés, auto parts counters, small e-commerce sellers managing their own fulfillment.

How It Works:
Add your items — name, SKU, starting stock, supplier lead time, and a safety stock buffer.
Log your sales as they happen — quantity and date.
StockWise calculates, per item:
Your real average daily demand, from a trailing sales window (not a guess).
The exact stock level at which you need to reorder right now.
A three-tier status: Healthy, Reorder, or Critical.
Items needing attention are flagged automatically on the dashboard, sorted so the most urgent items float to the top.

If an item has fewer than 3 logged sales, StockWise deliberately shows "Insufficient Data" instead of a number — a forecast built on 1–2 data points would be statistically meaningless, and showing a confident-looking number there would be misleading.

The Formulas

Moving Average Daily Demand

Sum of units sold in the trailing window (default: 14 days)
÷
Number of days in the window

Dividing by the number of days — not the number of sale entries — correctly accounts for zero-sale days. An item sold on 3 of the last 14 days has a much lower true daily average than one sold on all 14, and dividing by sale count would overstate demand for the first item.

Reorder Point (ROP)

ROP = (Average Daily Demand × Lead Time in Days) + Safety Stock

This is the stock level at which a new order must be placed to avoid running out before the replacement stock arrives.

Status Classification

currentStock ≤ ROP × 0.5   →  Critical  (eating into safety stock)
currentStock ≤ ROP          →  Reorder
currentStock > ROP          →  Healthy
Tech Stack

Phase 1 is intentionally built with plain HTML, CSS, and vanilla JavaScript — no frameworks, no build tools, no npm dependencies.

This is a deliberate scoping decision: Phase 1's job is to prove the forecasting algorithm and the end-to-end user flow work correctly, decoupled from any framework, before adding that layer of complexity. Every page runs standalone by opening index.html directly in a browser.

Layer	Choice
Structure	HTML5
Logic	Vanilla JavaScript (ES6)
Styling	Plain CSS with custom properties (design tokens)
Persistence	Browser localStorage
Deployment	Vercel (static hosting)
Project Structure
stockwise/
├── index.html              → Landing page
├── login/
│   └── index.html
├── signup/
│   └── index.html
├── dashboard/
│   └── index.html
├── css/
│   └── ...                 → One stylesheet per page, shared design tokens
├── js/
│   ├── storage.js          → The ONLY file that touches localStorage directly
│   ├── items.js             → Add Item logic + validation
│   ├── sales.js             → Log Sale logic + validation
│   ├── forecast.js          → Pure calculation functions (no DOM, no storage)
│   └── dashboard.js         → Rendering + event wiring only, no math
└── assets/
    └── logo.png

Why forecast.js is isolated: it contains only pure functions — movingAverageDemand(), reorderPoint(), getStockStatus() — with zero access to the DOM or localStorage. This makes the core math testable in complete isolation, and means this exact file can be reused unchanged if the project moves to a backend service in a later phase.

Why storage.js is the single gatekeeper: every other file reads and writes data through functions like getItems() and addSale(), never touching localStorage directly. When Phase 2 introduces a real backend, only this one file needs to be rewritten — swapping localStorage calls for fetch() calls — while every other file stays unchanged.

Data Model

Two flat, separate arrays — deliberately not nested — so they map cleanly onto two future SQL tables (items, sales):

js
// localStorage key: "inventory_items"
{
  id, name, sku, currentStock,
  leadTimeDays, safetyStock, reorderQty, createdAt
}

// localStorage key: "sales_log"
{
  id, itemId, quantitySold, date   // date as "YYYY-MM-DD", no time component
}

Also stored: registered_users (account records) and loggedInOwnerName / loggedInBusinessName (current session stand-in).

Running Locally

No installation required.

Clone or download this repository.
Open index.html directly in any browser (double-click, or drag into a browser window).
Navigate through Sign Up → Dashboard to start adding items and logging sales.

For local preview via a static server instead (optional):

bash
python3 -m http.server 8080
Live Demo

🔗 stockwise-nine-eta.vercel.app

Known Limitations (Phase 1)

Being transparent about these is intentional — they're scoped-out, not overlooked:

No real authentication. Accounts and sessions are stored in localStorage, including passwords in plain text. This is not secure and must not be treated as production-ready auth. Real authentication is planned for Phase 3.
No real backend. All data lives in one browser's localStorage — it doesn't sync across devices, doesn't survive a cleared browser cache, and isn't shared between users.
Single-window "session." There's no token, no expiry, no server-side validation of who's logged in.
Reorder Quantity is currently unused in any calculation — it's stored for a future auto-purchase-order feature.
Phase 2 Roadmap

Phase 2 focuses on moving StockWise off the browser and onto a real, persistent backend:

Backend service — Node.js/Express (or similar), replacing direct localStorage calls with real API endpoints.
Real database — PostgreSQL, using tables that mirror the existing items and sales data model almost 1:1, since Phase 1's flat, separate array structure was designed with this migration in mind.
storage.js becomes the migration boundary — since it was the only file touching localStorage directly, it's rewritten to call the new API instead; items.js, sales.js, forecast.js, and dashboard.js require no changes.
Persistent, cross-device data — inventory and sales history no longer tied to a single browser.
CSV import for onboarding a business's existing sales history instead of starting from zero.
Basic API validation and error handling to replace the client-only validation currently in items.js/sales.js.