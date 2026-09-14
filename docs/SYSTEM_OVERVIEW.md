# SYSTEM OVERVIEW — 531 Workshop Site

_Last reviewed: 2026-09-11. Documents the repository as it exists on branch `main`._

## Purpose

531 Workshop is a small custom‑woodworking business (hardwood cutting boards, custom
furniture, built‑ins) based in Lombard / the Chicagoland area. This repository is its
public marketing + light e‑commerce website. The site does three jobs:

1. **Marketing / brand presence** — home page (with a rotating Hero drawn from Gallery
   photos and a Shop preview), about page, project Gallery (category + per-project pages),
   FAQ (`app/page.tsx`, `app/about/page.tsx`, `app/gallery/**`, `app/faq/page.tsx`).
2. **Lead capture for custom work** — a contact form with double opt‑in email
   verification that writes leads (optionally carrying structured "project context" when
   the visitor arrived from a Gallery project or the Hero) to a Postgres database and
   emails the shop owner (`components/ContactForm.tsx`, `app/api/contact/route.ts`,
   `app/api/contact/verify/route.ts`).
3. **Direct product sales** — a small catalog of cutting boards sold through Shopify's
   hosted checkout, embedded via Shopify's Buy Button JavaScript SDK
   (`app/shop/page.tsx`, `app/shop/[slug]/page.tsx`,
   `components/shopify/ShopifyProductBuyButton.tsx`). A subset of the catalog is also
   surfaced directly on the homepage as a "Shop" preview section.

The site was built by "Three Eagles Forge Studio" (3EF), whose GitHub org owns the repo
(`git@github.com:3ef-studio/531workshop-site.git`) and whose consulting page is linked in
the footer (`components/Footer.tsx`).

## Technology stack

| Layer | Choice | Evidence |
|---|---|---|
| Framework | Next.js **16.0.10**, App Router | `package.json`, `app/` directory |
| UI runtime | React **19.2.1** / react‑dom 19.2.1 | `package.json` |
| Language | TypeScript **5.x**, `strict: true` | `tsconfig.json` |
| Styling | Tailwind CSS **v4** (`@tailwindcss/postcss`), `@tailwindcss/typography`, `tailwindcss-animate` | `postcss.config.*`, `tailwind.config.cjs`, `app/globals.css` |
| Icons | `lucide-react`, `react-icons` | `package.json`, `components/Footer.tsx` |
| Fonts | `next/font/google` — Geist + Geist Mono | `app/layout.tsx` |
| Database | PostgreSQL via `pg` (node‑postgres) `^8.16.3` | `app/api/contact/route.ts` |
| Transactional email | Resend `^6.6.0` | `app/api/contact/route.ts` |
| Commerce | Shopify Storefront API (GraphQL, `2024-04` / `2024-10`) + Shopify Buy Button SDK (CDN) | `app/api/shopify/*`, `components/shopify/*` |
| Image tooling | `scripts/optimize-images.mjs` uses `sharp` (transitive dep only — see TECHNICAL_DEBT) | `scripts/optimize-images.mjs` |
| Lint | ESLint 9 + `eslint-config-next` | `eslint.config.mjs` |
| Testing | Vitest 3 (unit/API, mocked I/O) + Playwright 1 (Chromium e2e, external requests blocked) | `test/`, `e2e/`, `docs/TESTING.md` |
| CI | GitHub Actions | `.github/workflows/ci.yml` |

There is **no `vercel.json`** or other deployment manifest in the repo; deployment is the
default Vercel⇄GitHub integration (see "Deployment / runtime environment" below).

## High‑level architecture

```
Browser
  │
  ├── Next.js App Router (server components render marketing + shop pages)
  │      • Content sourced from in-repo TS/JSON modules (lib/*.ts, data/products.json)
  │      • No CMS, no database reads on the public pages
  │      • Home resolves its Shop-preview products server-side (getProductBySlug)
  │      • Contact resolves an optional ?project=<slug> server-side (Gallery lookup)
  │
  ├── Client components (Hero rotation, forms, carousels, Shopify Buy Button host)
  │      • Hero auto-rotates through a curated set of Gallery photos; its "Start a
  │      │   Custom Project" CTA carries the active slide's slug to /contact
  │      • ContactForm  ── POST ──►  /api/contact  ──► Postgres (app.leads incl.
  │      │                                              project_context JSONB,
  │      │                                              app.email_verification_tokens)
  │      │                                          └─► Resend (verification email)
  │      • Shopify Buy Button SDK (loaded from sdks.shopifycdn.com)
  │             └─► renders an <iframe>, talks directly to Shopify Storefront API,
  │                 checkout hand-off to Shopify-hosted checkout
  │
  └── Email verification link  ── GET ──►  /api/contact/verify
             ├─► marks lead verified in Postgres
             ├─► Resend (internal "new verified inquiry" email to the shop, including
             │    any Gallery project context, escaped and presentation-formatted)
             └─► 302 redirect to /contact?confirmed=1
```

Two Shopify integration paths exist in the code. Only the **Buy Button SDK** path is wired
into a page. The server‑side Storefront GraphQL routes (`/api/shopify/cart`,
`/api/shopify/product`) are not referenced by any rendered component — see
`ARCHITECTURE.md` and `TECHNICAL_DEBT.md`.

## Major user‑facing capabilities

| Capability | Route(s) | Notes |
|---|---|---|
| Home / landing | `/` (`app/page.tsx`) | Rotating Hero (Gallery photos), 3 value props, Shop preview (3 featured products), testimonials carousel |
| Project Gallery | `/gallery` (landing), `/gallery/[category]` (5 categories), `/gallery/[category]/[slug]` (per-project page) | Category navigation, full mosaic grid, real per-project detail pages with a "I want something like this" → Contact CTA, embedded YouTube video on the landing page |
| Legacy alternate gallery | `/gallery1` (`app/gallery1/page.tsx`) | Not linked in nav; simple grid; pre-existing design alternative left in place — out of scope, see `TECHNICAL_DEBT.md` |
| About | `/about` | Copy, sticky image, YouTube embed, horizontal photo strip |
| FAQ | `/faq` | 18 Q&A items from `lib/faq-data.ts`, native `<details>` accordion |
| Product catalog | `/shop` | Cards sorted available‑first then price‑ascending |
| Product detail + purchase | `/shop/[slug]` | Shopify Buy Button (add to cart / checkout) for purchasable items; "Request a quote" link otherwise |
| Contact / project inquiry | `/contact` | Generic mode, or Gallery-inspired mode via `?project=<slug>` (shows project context, preselects Project type) → validated form → double opt‑in email → DB (incl. project context) + owner notification |
| Social links | Footer | Instagram, Facebook, TikTok (external) |

## Deployment / runtime environment

- **Target platform: Vercel.** Not proven by a config file, but strongly implied:
  `README.md` is the stock `create-next-app` Vercel readme, `public/vercel.svg` is
  present, `.gitignore` ignores `.vercel`, and `app/api/contact/route.ts` comments
  "In Vercel, client IP is usually forwarded" and reads `x-forwarded-for` / `x-real-ip`.
- **API route runtime:** `app/api/contact/route.ts` and `app/api/contact/verify/route.ts`
  pin `export const runtime = "nodejs"` (required for `pg` and `node:crypto`). The Shopify
  routes do not pin a runtime.
- **Rendering:** Public pages are React Server Components with all content coming from
  committed modules, so they render statically / are cacheable. `app/shop/[slug]/page.tsx`
  and the Gallery category/project pages have **no `generateStaticParams`**, so they
  render on demand (`params` is consumed as a `Promise`, per Next 16).
- **Node:** local dev observed on Node v24.4.1. No `engines` field constrains this.
- **External runtime dependencies at request time:** a reachable PostgreSQL instance
  (`DATABASE_URL`), the Resend API, `sdks.shopifycdn.com` (Buy Button script), the Shopify
  storefront domain, and `www.youtube-nocookie.com` (iframes). Google Tag Manager /
  Analytics loads only if `NEXT_PUBLIC_GA_ID` is set (it is not in the committed `.env`).
- **CI:** `.github/workflows/ci.yml` runs `npm ci` → `lint` → `test` → `build` → Playwright
  install → `test:e2e` on push to `main` and on every PR, using fake non-secret env values.
  See `docs/TESTING.md`.
- See `INTEGRATIONS.md` for the full environment‑variable list (names only).
</content>
