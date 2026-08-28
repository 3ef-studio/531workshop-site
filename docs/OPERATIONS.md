# OPERATIONS — 531 Workshop Site

_Last reviewed: 2026-08-27 (HEAD `eb40364`). Describes what the repository actually
provides for running, building, and deploying the site._

---

## Local development

```bash
npm install          # installs deps from package-lock.json
npm run dev          # next dev  → http://localhost:3000
```

Scripts (`package.json`):

| Script | Command | Notes |
|---|---|---|
| `dev` | `next dev` | Dev server. `.next/dev/` exists locally, so it has been run. |
| `build` | `next build` | Production build. No build output committed; `.next/` is gitignored. |
| `start` | `next start` | Serves a prior `next build`. |
| `lint` | `eslint` | Uses `eslint.config.mjs` (flat config: `core-web-vitals` + `typescript`). |

**Required for a fully working local environment** (see `INTEGRATIONS.md` for names): a
`.env` (or `.env.local`) providing at minimum `DATABASE_URL` and the Resend/Shopify
variables. There is **no `.env.example`** in the repo, so the required set must be
reconstructed from `INTEGRATIONS.md` or an existing deployment. Without a database and
Resend key the marketing pages and the Shopify Buy Button still work; only the contact
form breaks (500 or a silent "check your email").

Node: developed on Node v24.4.1 locally. No `engines` constraint and no `.nvmrc`.

**Image pipeline** (`scripts/optimize-images.mjs`, not wired to an npm script):
`node scripts/optimize-images.mjs` reads `./images-incoming/`, resizes to max 1600px, and
writes `.webp` at quality 85 into `./public/images/projects/`. It `import`s `sharp`, which
is **not a declared dependency** (`package.json`) — it currently resolves only because
Next.js pulls `sharp` in transitively. `images-incoming/` is gitignored. The current
`git status` shows a batch of new spaced‑filename `.webp` files staged in
`public/images/projects/` that duplicate existing hyphenated names.

## Build process

- `next build` with the App Router. `next.config.ts` is empty — no custom webpack, no
  `images` remote patterns (unnecessary: all `next/image` sources are local files under
  `/public`; YouTube is an iframe; Shopify renders in its own iframe).
- Pages are Server Components sourced entirely from committed modules, so they build as
  static/prerendered output. `app/shop/[slug]/page.tsx` has **no `generateStaticParams`**,
  so those pages are not prebuilt — they render on first request and are then cached by
  the platform.
- API routes: `app/api/contact/route.ts` and `.../verify/route.ts` set
  `export const runtime = "nodejs"`. The Shopify routes have no runtime directive.
- TypeScript is `strict`. `next build` runs type‑checking and ESLint by default (not
  disabled in `next.config.ts`), so type or lint errors fail the build.
- Tailwind v4 compiles via `@tailwindcss/postcss` (`postcss.config.cjs` /
  `postcss.config.mjs` — both exist and are identical; `globals.css` has
  `@config "../tailwind.config.cjs"` and `@import "tailwindcss"`).

## Deployment configuration

- **No deployment manifest is committed** (no `vercel.json`, `netlify.toml`, `Dockerfile`,
  or GitHub Actions workflow).
- **Platform: Vercel** (inferred — see `SYSTEM_OVERVIEW.md` for the evidence:
  stock Vercel README, `public/vercel.svg`, `.vercel` in `.gitignore`, and the
  `x-forwarded-for` handling in `app/api/contact/route.ts`). Deployment is presumably the
  default Vercel ⇄ GitHub integration on `git@github.com:3ef-studio/531workshop-site.git`,
  branch `main`.
- **Environment variables** must be configured in the hosting platform: `DATABASE_URL`,
  `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_TO_EMAIL`, `NEXT_PUBLIC_SITE_URL`, `SITE_URL`,
  `NEXT_PUBLIC_SHOPIFY_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`, and optionally
  `NEXT_PUBLIC_GA_ID` / `PGSSLMODE` / `POSTGRES_URL`.
- **Database provisioning is out of band.** The `app.leads` and
  `app.email_verification_tokens` tables must be created manually before the contact form
  works — there are no migrations in the repo. The `ssl: { rejectUnauthorized: false }`
  default suggests a hosted Postgres with a self‑signed / non‑bundled CA (e.g.
  Neon/Supabase/Vercel Postgres style).
- **Git branching:** current branch `main`; commit history is a single linear stream of
  small content/style commits ("Added images", "updated gallery", "hero tweak", …). No
  tags, no release process evident.

## Production dependencies (runtime)

From `package.json` `dependencies`:

| Package | Role at runtime |
|---|---|
| `next` 16.0.10 | Framework / server |
| `react`, `react-dom` 19.2.1 | UI |
| `pg` ^8.16.3 | Postgres client (contact API) |
| `resend` ^6.6.0 | Email API client (contact API) |
| `lucide-react` ^0.562.0, `react-icons` ^5.5.0 | Footer / UI icons |

External services that must be reachable in production: the Postgres host, `api.resend.com`,
`sdks.shopifycdn.com`, the Shopify store domain, `www.youtube-nocookie.com`, and
`www.googletagmanager.com` (only if GA enabled). `sharp` (optional Next dependency) is
needed for `next/image` optimization in production.

`devDependencies` include Tailwind v4 toolchain, `@tailwindcss/typography`,
`tailwindcss-animate`, TypeScript, ESLint 9, and `@types/*`.

## Analytics / monitoring

- **Application monitoring:** none in the repo. No Sentry, no logging service, no
  healthcheck endpoint. Errors surface only as `console.error` / `console.warn` in the
  route handlers (visible in the platform's function logs).
- **Web analytics:** Google Analytics is wired but disabled unless `NEXT_PUBLIC_GA_ID` is
  set (`app/layout.tsx`). Plausible is referenced in code but never loaded (no script) —
  all `track()` calls are no‑ops. See `INTEGRATIONS.md §6–7`.
- **Uptime/alerting:** not configured in‑repo.
- **The lead pipeline has no observability** beyond email delivery: if Resend fails
  silently (missing env) the operator gets no signal, and there is no admin view of
  `app.leads`.

## Operational considerations evident from the repository

1. **Content changes require a code deploy.** All copy, gallery items, FAQ, testimonials,
   and the product index live in `lib/*.ts` / `data/products.json`. A non‑developer cannot
   update the site.
2. **Product catalog ⇄ Shopify must be kept in sync by hand.** `data/products.json`
   hard‑codes numeric `shopify_product_id`s, titles, summaries, `price_display`
   strings, and image paths. Shopify is the source of truth for live price/availability
   (shown inside the Buy Button iframe); the site's own price strings can drift.
3. **Serverless + `pg` `Pool` per route module.** Each contact route creates its own pool
   at module scope; under serverless concurrency this can exhaust Postgres connections.
   Consider a pooled/serverless driver or `PgBouncer`. (See `TECHNICAL_DEBT.md`.)
4. **No rate limiting / spam protection on `/api/contact`.** Every POST writes a lead row
   and (post‑verify) can trigger emails. This is a cost and abuse surface.
5. **Verification links depend on a correct base URL.** If `SITE_URL` is unset the link is
   derived from the incoming request; behind proxies/preview deployments this can produce
   wrong or non‑routable links.
6. **`latest` Buy Button SDK URL** means Shopify can change the embed behavior/markup
   without a deploy here; the quantity‑persistence workaround in
   `ShopifyProductBuyButton.tsx` is coupled to current SDK internals.
7. **Duplicate/again‑committed image assets.** The working tree currently carries both
   `"Bar shelving.webp"` and `Bar-shelving.webp` style pairs; decide on one naming
   convention to avoid confusion and bloat.
8. **Bleeding‑edge framework versions** (Next 16.0.10, React 19.2.1, Tailwind 4). Upgrades
   and third‑party compatibility need care; pin/verify before bumping.
9. **No tests and no CI.** Regressions in the lead flow or the sort logic would only be
   caught manually.
