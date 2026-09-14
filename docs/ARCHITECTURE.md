# ARCHITECTURE — 531 Workshop Site

_Last reviewed: 2026-09-11. Describes the implementation as written._

## Repository structure

```
531workshop-site/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout: fonts, <html class="dark">, GA snippet, Header/Footer
│   ├── page.tsx                # Home — async; resolves featured Shop products server-side
│   ├── globals.css             # Tailwind entry + design-token contract + component classes
│   ├── theme-a.css             # Alternate color token set (NOT imported)
│   ├── theme-b.css             # Active color token set (imported by layout.tsx)
│   ├── theme-c.css             # Alternate token set incl. a .dark block (NOT imported)
│   ├── about/page.tsx
│   ├── contact/page.tsx        # reads ?confirmed / ?error / ?project search params
│   ├── faq/page.tsx
│   ├── gallery/page.tsx                    # Gallery landing: category nav + full mosaic
│   ├── gallery/[category]/page.tsx         # One category's projects
│   ├── gallery/[category]/[slug]/page.tsx  # A single project's detail page
│   ├── gallery1/page.tsx       # unlinked alternate gallery — legacy, out of scope (see debt)
│   ├── sitemap.ts              # /sitemap.xml — static routes + product pages + Gallery routes
│   ├── robots.ts               # /robots.txt — Allow: /, Disallow: /api/, points at the sitemap
│   ├── shop/page.tsx           # catalog grid
│   ├── shop/[slug]/page.tsx    # product detail page (PDP)
│   └── api/
│       ├── contact/route.ts            # POST: build project context, create lead + send verification email
│       ├── contact/verify/route.ts     # GET: verify token, notify owner (with project context), redirect
│       ├── shopify/product/route.ts    # GET ?handle= : Storefront product query (see debt)
│       └── shopify/cart/route.ts       # POST: Storefront cart create / add (see debt)
├── components/
│   ├── Header.tsx              # "use client" — sticky nav, mobile menu, scroll state; "Custom Gallery" → /gallery
│   ├── Footer.tsx              # server component; gallery link → /gallery
│   ├── Hero.tsx                # "use client" — rotating hero (see "Hero rotation" below)
│   ├── ContactForm.tsx         # "use client" — the real lead form, incl. optional project fields
│   ├── TestimonialsCarousel.tsx# "use client"
│   ├── GalleryCard.tsx         # "use client" — image tile; optional `href` makes the whole tile a project link
│   ├── ProductCard.tsx         # server component; reused for the homepage Shop preview and /shop
│   ├── LeadForm.tsx            # "use client" — UNUSED (posts to non-existent /api/lead)
│   ├── NewsletterForm.tsx      # "use client" — UNUSED (posts to non-existent /api/subscribe)
│   ├── ProjectCard.tsx         # UNUSED (links to non-existent /projects/[slug] — unrelated to Gallery projects)
│   ├── ClientEvent.tsx         # "use client" — UNUSED analytics helper
│   ├── CtaTrack.tsx            # "use client" — UNUSED analytics link wrapper
│   └── shopify/
│       ├── ShopifyProductBuyButton.tsx  # "use client" — Buy Button SDK host (USED on PDP)
│       ├── buyButtonUI.ts               # "use client" — Buy Button drawer-cart helpers (used only by ConfigurableAddToCart)
│       └── ConfigurableAddToCart.tsx    # "use client" — UNUSED custom variant picker
├── lib/
│   ├── site.ts                 # SITE constants (name, description, url)
│   ├── analytics.ts            # track() → window.plausible (no Plausible script is loaded)
│   ├── faq-data.ts             # FAQ content
│   ├── gallery-data.ts         # GALLERY_IMAGES (id/slug/category model), CATEGORIES, lookup helpers
│   ├── hero-data.ts            # Hero rotation config — resolves slides from GALLERY_IMAGES by id
│   ├── home-data.ts            # value props, FEATURED_PRODUCT_SLUGS, testimonials
│   ├── contactOptions.ts       # Project Type / Timeframe option lists shared by form, API, and email
│   ├── contactValidation.ts    # client-side contact form validation rules (pure function, unit-tested)
│   ├── products.ts             # reads data/products.json
│   ├── portfolio.ts            # UNUSED — 3EF portfolio content (VeilMark, DDE, csv-tools…)
│   └── newsletter/dde.ts       # UNUSED — reads data/dde/* JSON that is not in the repo
├── data/products.json          # the product catalog (7 items)
├── types/                      # product.ts, project.ts (unused, see TECHNICAL_DEBT B3), shopify-buy-button.d.ts
├── scripts/optimize-images.mjs # sharp-based /images-incoming → /public/images/projects
├── public/                     # brand logos, project photos (.webp/.jpg), stock CNA svgs
├── images-incoming/            # gitignored source images for the optimize script
├── test/                       # Vitest unit + API route tests
├── e2e/                        # Playwright smoke tests (fixtures.ts blocks external requests)
├── .github/workflows/ci.yml    # push to main + PRs: lint → test → build → e2e
├── next.config.ts              # redirects(): permanent /gallery2 → /gallery
├── tailwind.config.cjs         # design tokens mapped to CSS vars; darkMode: ["class"]
└── .env                        # local secrets (gitignored; not committed)
```

`app/gallery2/page.tsx` no longer exists — it was replaced by the `app/gallery/` route tree and
a permanent redirect (see below). `app/gallery1/page.tsx` is untouched, unlinked legacy content;
it was explicitly out of scope for the Gallery rebuild and remains its own tracked debt item.

## Important routes

### Pages

| Route | File | Rendering | Data source |
|---|---|---|---|
| `/` | `app/page.tsx` | Server, `async` — awaits `getProductBySlug` for the Shop preview | `lib/home-data.ts`, `data/products.json` |
| `/about` | `app/about/page.tsx` | Server | Inline JSX + hard‑coded image list |
| `/contact` | `app/contact/page.tsx` | Server; awaits `searchParams` (`confirmed`, `error`, `project`) | `lib/gallery-data.ts` (resolves `?project=`) |
| `/faq` | `app/faq/page.tsx` | Server | `lib/faq-data.ts` |
| `/gallery` | `app/gallery/page.tsx` | Server | `lib/gallery-data.ts` |
| `/gallery/[category]` | `app/gallery/[category]/page.tsx` | Server; `notFound()` on an unknown category; `generateMetadata` | `lib/gallery-data.ts` |
| `/gallery/[category]/[slug]` | `app/gallery/[category]/[slug]/page.tsx` | Server; `notFound()` on unknown category/slug/mismatch; `generateMetadata` | `lib/gallery-data.ts` |
| `/gallery2` | — (no page) | 308 permanent redirect → `/gallery` (`next.config.ts`) | — |
| `/gallery1` | `app/gallery1/page.tsx` | Server | `lib/gallery-data.ts` (legacy, unlinked — see debt) |
| `/shop` | `app/shop/page.tsx` | Server; `async`, `await getAllProducts()` | `data/products.json` |
| `/shop/[slug]` | `app/shop/[slug]/page.tsx` | Server; dynamic params (no `generateStaticParams`); `generateMetadata` | `data/products.json` |

`app/shop/[slug]/page.tsx` and `app/gallery/[category]/[slug]/page.tsx` both call `notFound()`
for an unresolvable route. `app/gallery/[category]/[slug]/page.tsx` also 404s when the slug
exists but under a *different* category (the URL's category segment must match the item's
actual category — it is not just an arbitrary path prefix). There is no custom `not-found.tsx`,
`error.tsx`, or `loading.tsx` anywhere — Next defaults apply.

### API routes

| Route | Method | Purpose | Backend calls |
|---|---|---|---|
| `/api/contact` | POST | Validate, build server-side project context from an optional Gallery slug, insert unverified lead, create hashed verification token, email a confirm link | Postgres (`BEGIN`/`COMMIT`), Resend `emails.send` |
| `/api/contact/verify` | GET `?token=` | Look up unexpired/unused token, mark lead verified, mark token used, email the shop owner (including any project context), 302 → `/contact?confirmed=1` | Postgres, Resend |
| `/api/shopify/product` | GET `?handle=` | Query a product's options + variants from the Storefront API and reshape for `ConfigurableAddToCart` | `fetch` Shopify Storefront GraphQL `2024-10` |
| `/api/shopify/cart` | POST `{variantId, quantity}` | Create a Storefront cart or add a line; persist `shopify_cart_id` httpOnly cookie | `fetch` Shopify Storefront GraphQL `2024-04` |

**No route referenced by any rendered page calls `/api/shopify/cart`.**
`/api/shopify/product` is fetched only by `components/shopify/ConfigurableAddToCart.tsx`,
which is itself imported nowhere. Both routes are effectively dead code today (see
`TECHNICAL_DEBT.md`).

There are **no `/api/lead` or `/api/subscribe` routes**, although `LeadForm.tsx` and
`NewsletterForm.tsx` POST to them.

## Major components

- **`Header.tsx`** — client component. Sticky header that toggles a translucent/blur
  background after `window.scrollY > 8`; hamburger menu for `< 640px`; auto‑closes the
  mobile menu on resize to desktop. Nav: Shop, Custom Gallery (`/gallery`), About,
  Contact, FAQ. `BrandLogo` swaps `logo-black.png` / `logo-white.png` via
  `dark:hidden` / `dark:block`.
- **`Footer.tsx`** — server component. Company blurb, page links (Gallery → `/gallery`),
  social icons, dynamic copyright year, "Built by Three Eagles Forge Studio" credit linking
  to `https://3ef.studio/consulting`.
- **`Hero.tsx`** — client component. Rotates through a small, hand-picked set of Gallery
  project photos (`lib/hero-data.ts` → `HERO_SLIDES`, resolved from `GALLERY_IMAGES` by
  `id`, on a `HERO_ROTATION_INTERVAL_MS` interval, currently 15s). Reduced-motion detection
  uses `useSyncExternalStore` against `(prefers-reduced-motion: reduce)` — deliberately not a
  `useMemo`/`useEffect` read, so the value can't get stuck on a stale hydration snapshot.
  Auto-advance is gated on `!isPaused && !prefersReducedMotion` and stops permanently the
  first time the visitor interacts with any control (prev/next/dot/pause). Two CTAs:
  "View Our Work" → `/gallery` (static), and "Start a Custom Project" →
  `` `/contact?project=${activeSlide.slug}` `` — contextual to whichever slide is currently
  showing, falling back to plain `/contact` if the active slide has no slug. Prev/next/dot/
  pause controls and the optional project-info disclosure are rendered **twice** — one
  cluster overlaid on the photo (`hidden sm:flex`, desktop only) and one below the image on
  plain page background (`flex sm:hidden`, mobile only) — matching the existing
  `Header.tsx` desktop/mobile duplication convention rather than repositioning one shared
  element. The info toggle ("i" button + detail popover) is desktop-only.
- **`ContactForm.tsx`** — client component. Renders required First/Last name, Email, and
  Message fields plus optional Phone, Project type, Approximate size, and Timeframe fields
  (`lib/contactOptions.ts` supplies the Project type / Timeframe option lists). Accepts
  `projectSlug` / `initialProjectType` props from the page (used only to preselect Project
  type and to attach the slug to the submission — see "Lead flow" below). Client-side
  validation (`lib/contactValidation.ts`, extracted to a pure function for testing) mirrors
  the server: names required, email regex, optional phone ≥10 digits, message 20–4000
  chars, dimensions capped. Labels use `useId`-derived `htmlFor`/`id` pairs and
  `aria-describedby`/`aria-invalid` for accessible error/hint association. POSTs
  `{...values, projectSlug}` to `/api/contact` — note only the slug is sent, never a
  title/category the client could spoof.
- **`TestimonialsCarousel.tsx`** — client component. 1‑up on mobile / 2‑up on `md+`,
  pointer‑drag swipe, arrow keys, dot pagination, honors `prefers-reduced-motion` via a
  `useMemo`/effect read (the older pattern — see `TECHNICAL_DEBT.md` E5 for the inconsistency
  with `Hero.tsx`'s newer `useSyncExternalStore` approach). Fed by `TESTIMONIALS` from
  `lib/home-data.ts`.
- **`GalleryCard.tsx`** — client component. Image tile with optional hover title. When an
  `href` prop is passed, the whole tile becomes a `<Link>` to that URL (used for every
  `/gallery` and `/gallery/[category]` tile, linking to the item's project page); omitting
  `href` renders a plain, non-interactive tile (used by the legacy `/gallery1`). The
  click-to-open detail **modal that previously existed here has been removed** — project
  detail is now a real page (`/gallery/[category]/[slug]`), not a dialog.
- **`ProductCard.tsx`** — server component. Grid card: thumbnail, badges, clamped
  title/summary, price, and the `cta_primary` link from `products.json`. Used on `/shop`
  and reused as-is (no duplication) for the homepage Shop preview. Contains dormant
  "RapidAPI tiers" rendering branches inherited from a generic template.
- **`ShopifyProductBuyButton.tsx`** — client component. Dynamically injects
  `https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js`, builds a
  Storefront client from `NEXT_PUBLIC_SHOPIFY_DOMAIN` / `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`,
  and renders a Shopify `product` component (iframe) with options/quantity/button. Reads
  theme CSS variables via `getComputedStyle` to style the embed. Includes workaround logic
  (`afterRender`, `addVariantToCart`, `updateQuantity` events) to keep the quantity from
  resetting to 1 on variant change. Checkout is handled by Shopify.

## Server vs client responsibilities

**Server (RSC / route handlers):**
- Renders every page's markup and metadata from committed data modules.
- Resolves the Gallery project for `?project=<slug>` on `/contact` (`findGalleryProjectBySlug`)
  and for the Home Shop preview (`getProductBySlug`) — both server-side, before render.
- `app/api/contact/*` — all DB access and all Resend email sending. `runtime = "nodejs"`.
  This includes re-deriving project title/category from the trusted `GALLERY_IMAGES` source
  at submission time — the client-sent `projectSlug` is a lookup key, never trusted data.
- `app/api/shopify/*` — Storefront API proxy calls (currently unreferenced).
- `generateMetadata` in `app/shop/[slug]/page.tsx`, `app/gallery/[category]/page.tsx`, and
  `app/gallery/[category]/[slug]/page.tsx`; global metadata in `app/layout.tsx`
  (`metadataBase`, OpenGraph, Twitter card).

**Client (`"use client"`):**
- All interactivity: header menu/scroll, the Hero rotation, forms, testimonials carousel.
- The entire Shopify purchase flow runs client‑side in the browser through the Buy Button
  SDK and its iframe — the Next server is not in the cart/checkout path.
- Analytics helpers (`lib/analytics.ts`, `ClientEvent`, `CtaTrack`) call
  `window.plausible` if present.

## Data sources and data flow

| Data | Where it lives | Consumed by | Mutable at runtime? |
|---|---|---|---|
| Marketing copy, value props, testimonials, featured-product slugs | `lib/home-data.ts` | `app/page.tsx` | No (code change + redeploy) |
| Hero rotation config (slide ids, interval) | `lib/hero-data.ts` | `components/Hero.tsx` | No |
| Gallery items (id, slug, category, tags, detail fields) | `lib/gallery-data.ts` | `/gallery`, `/gallery/[category]`, `/gallery/[category]/[slug]`, `/gallery1`, `Hero.tsx` (via `hero-data.ts`), `/contact` (via slug lookup) | No |
| Contact Project Type / Timeframe option lists | `lib/contactOptions.ts` | `ContactForm.tsx`, `app/api/contact/route.ts`, `app/api/contact/verify/route.ts` | No |
| FAQ | `lib/faq-data.ts` | `/faq` | No |
| Product catalog | `data/products.json` via `lib/products.ts` | `/shop`, `/shop/[slug]`, homepage Shop preview, `ProductCard` | No |
| Live product price / variants / availability | Shopify (Storefront API) | Buy Button iframe on PDP | Yes (Shopify admin) |
| Leads + their optional project context | Postgres schema `app` — tables `leads` (incl. `project_context JSONB`), `email_verification_tokens` | `/api/contact`, `/api/contact/verify` | Yes (writes) |
| Owner notifications | Resend | `/api/contact/verify` | — |

**Lead flow (the one real write path), including the optional project-inquiry context:**
1. A visitor may arrive at `/contact` two ways: directly (generic inquiry), or via a
   Gallery project page's "I want something like this" CTA or the Hero's "Start a Custom
   Project" CTA — both of which link to `` `/contact?project=<slug>` ``. `/contact`
   resolves the slug server-side (`findGalleryProjectBySlug`); an unknown/stale slug just
   falls back to the normal experience (no error state). A resolved project renders a small
   context card and preselects the matching Project Type in the form.
2. `ContactForm` POSTs `{firstName,lastName,email,phone,message,projectType,dimensions,
   timeframe,projectSlug}` to `/api/contact` — the slug is the *only* Gallery-derived field
   trusted from the client.
3. Route validates required fields, builds a `project_context` object entirely server-side
   (`buildProjectContext`): re-resolves `gallerySlug`/`galleryTitle`/`galleryCategory` from
   `GALLERY_IMAGES` by the submitted slug (ignored silently if unknown), validates
   `projectType`/`timeframe` against `lib/contactOptions.ts`'s allow-lists (dropped silently
   if invalid — low-stakes optional fields, not worth rejecting the whole submission over),
   and truncates `dimensions` to `MAX_DIMENSIONS_LENGTH`. Empty context serializes to `null`.
4. Opens a `pg` transaction, `INSERT`s into `app.leads` (`verified = FALSE`, plus
   `source='contact'`, `referer`, `ip` from `x-forwarded-for`/`x-real-ip`, `user_agent`, and
   `project_context` as `JSON.stringify(...)` or `null`).
5. Generates a random 32‑byte token (`base64url`), stores **only its SHA‑256 hash** in
   `app.email_verification_tokens` with a 24h `expires_at`, commits.
6. Sends the raw token in a confirm‑link email via Resend
   (`{baseUrl}/api/contact/verify?token=…`). `baseUrl` = `SITE_URL` env, else derived from
   the request URL.
7. If `EMAIL_FROM` or `RESEND_API_KEY` is missing, the route still returns `ok: true` and
   just `console.error`s.
8. User clicks the link → `/api/contact/verify` re‑hashes the token, finds a row where
   `used_at IS NULL AND expires_at > now()`, sets `leads.verified = TRUE`, sets
   `token.used_at = now()`, commits.
9. Sends an internal "New verified inquiry" email to `CONTACT_TO_EMAIL` (skipped with a
   `console.warn` if `CONTACT_TO_EMAIL` / `EMAIL_FROM` / `RESEND_API_KEY` missing). The
   email HTML-escapes every user-supplied value (name, email, phone, message, dimensions),
   presentation-formats the phone number and the submitted-at timestamp
   (`America/Chicago`, DST-correct via `Intl.DateTimeFormat`), and renders a project-context
   block only when one exists — suppressing the "Category:" line when it would just repeat
   the customer-selected "Project type:" line verbatim.
10. 302 redirect to `/contact?confirmed=1`.

The database schema is **not defined in this repo** — the tables `app.leads` (now including
`project_context JSONB`, applied out-of-band to production) and
`app.email_verification_tokens` (and columns `verified_at`, etc.) are assumed to already
exist. No migrations directory, no schema SQL.

## State management

No state library. State is local React state (`useState`/`useRef`/`useEffect`/
`useSyncExternalStore`) inside the client components listed above. Notably:

- **`Hero.tsx`** — `index` (active slide), `isPaused` (set permanently once the visitor
  interacts with any rotation control), `showInfo` (project-info popover), plus the
  externally-synced `prefersReducedMotion` snapshot.
- **Shopify Buy Button cart** — managed entirely by the Shopify SDK (its own
  storage/cookies), surfaced through `window.__buyButtonUI__` (a cached init promise in
  `components/shopify/buyButtonUI.ts`).
- **`shopify_cart_id` cookie** — set by `/api/shopify/cart` (httpOnly, 14‑day). Written
  but never read by any UI code path in the repo.
- URL search params on `/contact` (`?confirmed=1`, `?error=`, `?project=<slug>`).

## Architectural decisions evident from the implementation

See `docs/DECISIONS.md` for a chronological log of the specific Gallery/Contact/Hero
decisions made this project. The broader, longer-standing decisions:

1. **Content as code.** No CMS. All editorial content is TypeScript/JSON in `lib/` and
   `data/`. Changes require a commit + redeploy. Keeps hosting trivial; makes non‑dev
   edits impossible.
2. **Commerce is fully outsourced to Shopify.** The site never holds inventory, price, or
   checkout logic; it embeds Shopify's Buy Button and links to Shopify's hosted checkout.
   `data/products.json` is only a local index (title, summary, photos, a numeric
   `shopify_product_id`, and CTA text).
3. **Double opt‑in for leads.** Tokens are single‑use, time‑boxed, and stored hashed —
   deliberate anti‑abuse / GDPR‑friendly design in `/api/contact`.
4. **Design‑token theming via CSS custom properties.** `app/globals.css` defines a token
   contract; `theme-a/b/c.css` provide interchangeable palettes; `layout.tsx` imports
   exactly one (`theme-b.css`). Tailwind colors in `tailwind.config.cjs` are all
   `hsl(var(--token))`. The Buy Button embed reads the same tokens at runtime so the
   iframe matches the site.
5. **`<html class="dark">` is hard‑coded** but the active palette (`theme-b.css`) defines
   only light `:root` values (no `.dark` block), and `globals.css` sets
   `color-scheme: light`. Net effect: the site renders light, while Tailwind `dark:`
   variants are permanently "on" (so Header/Footer always show the white logo). This is
   an inconsistency, not a designed dark mode — see `TECHNICAL_DEBT.md`.
6. **Template lineage.** `ProjectCard.tsx`, `LeadForm.tsx`, `NewsletterForm.tsx`,
   `lib/portfolio.ts`, `lib/newsletter/dde.ts`, `types/project.ts`, and RapidAPI pricing
   types in `types/product.ts` are carried over from a different 3EF project and are
   unreferenced here.
7. **A stable dual-identifier pattern for Gallery items.** Each `GalleryImage` keeps its
   legacy `id` (so `lib/hero-data.ts`'s existing `HERO_SLIDE_IDS` list doesn't need to
   change) alongside a new, URL-facing `slug` used for routing and for the Contact
   project-context handoff. See `docs/DECISIONS.md`.
</content>
