# ARCHITECTURE — 531 Workshop Site

_Last reviewed: 2026-08-27 (HEAD `eb40364`). Describes the implementation as written._

## Repository structure

```
531workshop-site/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout: fonts, <html class="dark">, GA snippet, Header/Footer
│   ├── page.tsx                # Home
│   ├── globals.css             # Tailwind entry + design-token contract + component classes
│   ├── theme-a.css             # Alternate color token set (NOT imported)
│   ├── theme-b.css             # Active color token set (imported by layout.tsx)
│   ├── theme-c.css             # Alternate token set incl. a .dark block (NOT imported)
│   ├── about/page.tsx
│   ├── contact/page.tsx        # reads ?confirmed / ?error search params
│   ├── faq/page.tsx
│   ├── gallery1/page.tsx       # unlinked alternate gallery
│   ├── gallery2/page.tsx       # primary gallery (nav + footer link here)
│   ├── shop/page.tsx           # catalog grid
│   ├── shop/[slug]/page.tsx    # product detail page (PDP)
│   └── api/
│       ├── contact/route.ts            # POST: create lead + send verification email
│       ├── contact/verify/route.ts     # GET: verify token, notify owner, redirect
│       ├── shopify/product/route.ts    # GET ?handle= : Storefront product query (see debt)
│       └── shopify/cart/route.ts       # POST: Storefront cart create / add (see debt)
├── components/
│   ├── Header.tsx              # "use client" — sticky nav, mobile menu, scroll state
│   ├── Footer.tsx              # server component
│   ├── Hero.tsx                # server component
│   ├── ContactForm.tsx         # "use client" — the real lead form
│   ├── TestimonialsCarousel.tsx# "use client"
│   ├── GalleryCard.tsx         # "use client" — image tile + detail modal
│   ├── ProductCard.tsx         # server component
│   ├── LeadForm.tsx            # "use client" — UNUSED (posts to non-existent /api/lead)
│   ├── NewsletterForm.tsx      # "use client" — UNUSED (posts to non-existent /api/subscribe)
│   ├── ProjectCard.tsx         # UNUSED (links to non-existent /projects/[slug])
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
│   ├── gallery-data.ts         # GALLERY_IMAGES content
│   ├── home-data.ts            # value props, featured items, testimonials
│   ├── products.ts             # reads data/products.json
│   ├── portfolio.ts            # UNUSED — 3EF portfolio content (VeilMark, DDE, csv-tools…)
│   └── newsletter/dde.ts       # UNUSED — reads data/dde/* JSON that is not in the repo
├── data/products.json          # the product catalog (7 items)
├── types/                      # product.ts, project.ts, shopify-buy-button.d.ts
├── scripts/optimize-images.mjs # sharp-based /images-incoming → /public/images/projects
├── public/                     # brand logos, project photos (.webp/.jpg), stock CNA svgs
├── images-incoming/            # gitignored source images for the optimize script
├── next.config.ts              # empty (no custom config)
├── tailwind.config.cjs         # design tokens mapped to CSS vars; darkMode: ["class"]
└── .env                        # local secrets (gitignored; not committed)
```

## Important routes

### Pages

| Route | File | Rendering | Data source |
|---|---|---|---|
| `/` | `app/page.tsx` | Server (static content) | `lib/home-data.ts` |
| `/about` | `app/about/page.tsx` | Server | Inline JSX + hard‑coded image list |
| `/contact` | `app/contact/page.tsx` | Server; awaits `searchParams` (`confirmed`, `error`) | none |
| `/faq` | `app/faq/page.tsx` | Server | `lib/faq-data.ts` |
| `/gallery1` | `app/gallery1/page.tsx` | Server | `lib/gallery-data.ts` |
| `/gallery2` | `app/gallery2/page.tsx` | Server | `lib/gallery-data.ts` |
| `/shop` | `app/shop/page.tsx` | Server; `async`, `await getAllProducts()` | `data/products.json` |
| `/shop/[slug]` | `app/shop/[slug]/page.tsx` | Server; dynamic params (no `generateStaticParams`); `generateMetadata` | `data/products.json` |

`app/shop/[slug]/page.tsx` calls `notFound()` when the slug is not in `products.json`.
There is no custom `not-found.tsx`, `error.tsx`, or `loading.tsx` anywhere — Next defaults
apply.

### API routes

| Route | Method | Purpose | Backend calls |
|---|---|---|---|
| `/api/contact` | POST | Validate + insert unverified lead, create hashed verification token, email a confirm link | Postgres (`BEGIN`/`COMMIT`), Resend `emails.send` |
| `/api/contact/verify` | GET `?token=` | Look up unexpired/unused token, mark lead verified, mark token used, email the shop owner, 302 → `/contact?confirmed=1` | Postgres, Resend |
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
  mobile menu on resize to desktop. Nav: Shop, Custom Gallery (`/gallery2`), About,
  Contact, FAQ. `BrandLogo` swaps `logo-black.png` / `logo-white.png` via
  `dark:hidden` / `dark:block`.
- **`Footer.tsx`** — server component. Company blurb, page links, social icons, dynamic
  copyright year, "Built by Three Eagles Forge Studio" credit linking to
  `https://3ef.studio/consulting`.
- **`Hero.tsx`** — server component. Full‑bleed image (`Cutting-board-collage.webp`) with
  overlay, watermark logo, headline, and a single "Shop" CTA.
- **`ContactForm.tsx`** — client component. Client‑side validation
  (`validate()` — names required, email regex, optional phone ≥10 digits, message
  20–4000 chars), POSTs JSON to `/api/contact`, renders success ("check your email") /
  error banners, clears the form on success.
- **`TestimonialsCarousel.tsx`** — client component. 1‑up on mobile / 2‑up on `md+`,
  pointer‑drag swipe, arrow keys, dot pagination, honors `prefers-reduced-motion`.
  Fed by `TESTIMONIALS` from `lib/home-data.ts`.
- **`GalleryCard.tsx`** — client component. Image tile with optional hover title; when
  `detailsOnClick` and the item has details, clicking opens a hand‑rolled modal
  (`role="dialog"`, Esc to close, body scroll lock). Used with `detailsOnClick` on
  `/gallery2`, without it on `/gallery1`.
- **`ProductCard.tsx`** — server component. Grid card: thumbnail, badges, clamped
  title/summary, price, and the `cta_primary` link from `products.json`. Contains
  dormant "RapidAPI tiers" rendering branches inherited from a generic template.
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
- `app/api/contact/*` — all DB access and all Resend email sending. `runtime = "nodejs"`.
- `app/api/shopify/*` — Storefront API proxy calls (currently unreferenced).
- `generateMetadata` in `app/shop/[slug]/page.tsx`; global metadata in `app/layout.tsx`
  (`metadataBase`, OpenGraph, Twitter card, canonical).

**Client (`"use client"`):**
- All interactivity: header menu/scroll, forms, testimonials carousel, gallery modal.
- The entire Shopify purchase flow runs client‑side in the browser through the Buy Button
  SDK and its iframe — the Next server is not in the cart/checkout path.
- Analytics helpers (`lib/analytics.ts`, `ClientEvent`, `CtaTrack`) call
  `window.plausible` if present.

## Data sources and data flow

| Data | Where it lives | Consumed by | Mutable at runtime? |
|---|---|---|---|
| Marketing copy, value props, testimonials | `lib/home-data.ts` | `app/page.tsx` | No (code change + redeploy) |
| Gallery items | `lib/gallery-data.ts` | `/gallery1`, `/gallery2` | No |
| FAQ | `lib/faq-data.ts` | `/faq` | No |
| Product catalog | `data/products.json` via `lib/products.ts` | `/shop`, `/shop/[slug]`, `ProductCard` | No |
| Live product price / variants / availability | Shopify (Storefront API) | Buy Button iframe on PDP | Yes (Shopify admin) |
| Leads | Postgres schema `app` — tables `leads`, `email_verification_tokens` | `/api/contact`, `/api/contact/verify` | Yes (writes) |
| Owner notifications | Resend | `/api/contact/verify` | — |

**Lead flow (the one real write path):**
1. `ContactForm` POSTs `{firstName,lastName,email,phone,message}` to `/api/contact`.
2. Route validates, opens a `pg` transaction, `INSERT`s into `app.leads`
   (`verified = FALSE`, plus `source='contact'`, `referer`, `ip` from
   `x-forwarded-for`/`x-real-ip`, `user_agent`).
3. Generates a random 32‑byte token (`base64url`), stores **only its SHA‑256 hash** in
   `app.email_verification_tokens` with a 24h `expires_at`, commits.
4. Sends the raw token in a confirm‑link email via Resend
   (`{baseUrl}/api/contact/verify?token=…`). `baseUrl` = `SITE_URL` env, else derived from
   the request URL.
5. If `EMAIL_FROM` or `RESEND_API_KEY` is missing, the route still returns `ok: true` and
   just `console.error`s.
6. User clicks the link → `/api/contact/verify` re‑hashes the token, finds a row where
   `used_at IS NULL AND expires_at > now()`, sets `leads.verified = TRUE`, sets
   `token.used_at = now()`, commits.
7. Sends an internal "New verified inquiry" email to `CONTACT_TO_EMAIL` (skipped with a
   `console.warn` if `CONTACT_TO_EMAIL` / `EMAIL_FROM` / `RESEND_API_KEY` missing).
8. 302 redirect to `/contact?confirmed=1`.

The database schema is **not defined in this repo** — the tables `app.leads` and
`app.email_verification_tokens` (and columns `verified_at`, etc.) are assumed to already
exist. No migrations directory, no schema SQL.

## State management

No state library. State is local React state (`useState`/`useRef`/`useEffect`) inside the
client components listed above. Cross‑page/browser‑persistent state:

- **Shopify Buy Button cart** — managed entirely by the Shopify SDK (its own
  storage/cookies), surfaced through `window.__buyButtonUI__` (a cached init promise in
  `components/shopify/buyButtonUI.ts`).
- **`shopify_cart_id` cookie** — set by `/api/shopify/cart` (httpOnly, 14‑day). Written
  but never read by any UI code path in the repo.
- URL search params on `/contact` (`?confirmed=1`, `?error=`).

## Architectural decisions evident from the implementation

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
6. **Template lineage.** Numerous files (`ProjectCard`, `LeadForm`, `NewsletterForm`,
   `lib/portfolio.ts`, `lib/newsletter/dde.ts`, RapidAPI pricing types in
   `types/product.ts`) are carried over from a different 3EF project and are unreferenced
   here.
