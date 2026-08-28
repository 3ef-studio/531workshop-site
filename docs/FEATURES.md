# FEATURES — 531 Workshop Site

_Last reviewed: 2026-08-27 (HEAD `eb40364`). Each feature is described as implemented._

---

## 1. Home / landing page

**Route:** `/` — `app/page.tsx`
**Primary files:** `app/page.tsx`, `components/Hero.tsx`, `components/TestimonialsCarousel.tsx`, `lib/home-data.ts`

How it works:
- `Hero` (server component) renders a full‑bleed `Cutting-board-collage.webp` with an
  overlay, a semi‑transparent watermark logo, headline copy, and one CTA button to
  `/shop`. Layout is `aspect-4/5` on mobile, `aspect-16/7` on desktop.
- "Custom Projects" section maps `VALUE_PROPS` (3 items) from `lib/home-data.ts` into
  cards, followed by a "Request a quote" button linking to `/contact`.
- "Featured work" renders `FEATURED_ITEMS.slice(0, 2)` from `lib/home-data.ts`. Both
  featured items currently link to `/gallery2` (there are no per‑project pages). A "View
  full gallery →" link also points to `/gallery2`.
- "What clients say" shows a static 5‑star glyph, `TESTIMONIAL_META.rating` (4.9) and
  `TESTIMONIAL_META.count` (18) — note only 5 testimonials exist in `TESTIMONIALS` — then
  renders `TestimonialsCarousel`.

`TestimonialsCarousel` (client): responsive slides‑per‑view (1 / 2), pointer‑drag swipe
with an 80px‑or‑8vw threshold, ArrowLeft/ArrowRight when focused, dot pagination, and a
`prefers-reduced-motion` check that disables the transform transition.

Dependencies: content only; no backend.

---

## 2. Project gallery

**Routes:** `/gallery2` (primary, linked from nav + footer + home), `/gallery1` (present, not linked)
**Primary files:** `app/gallery2/page.tsx`, `app/gallery1/page.tsx`, `components/GalleryCard.tsx`, `lib/gallery-data.ts`

How it works:
- `GALLERY_IMAGES` (21 entries) in `lib/gallery-data.ts` is the single source. Each entry
  has `id`, `src` (under `/public`), `alt`, and optional `title`, `description`,
  `materials`, `year`, `dimensions`, `tags`, `featured`.
- `/gallery2`: a CSS‑grid mosaic. `getMosaicSpan(index)` gives some tiles
  `col-span-2` / `row-span-2` based on `index % 12`. Cards use `titleOnHover`,
  `fillParent`, `scaleOnHover`, `detailsOnClick`. Also embeds a YouTube video
  (`youtube-nocookie.com/embed/wQ63sQTePeE`) and a "Request a quote" button to `/contact`.
- `/gallery1`: a plain 2‑column grid, `aspect="landscape"`, titles always shown, no
  click‑through. No navigation links to it; reachable only by direct URL.
- `GalleryCard` (client): when `detailsOnClick` is set **and** the item has any of
  description/materials/year/dimensions/tags, the image becomes a `<button>` that opens a
  modal (`role="dialog"`, `aria-modal`, Esc handler, `document.body.style.overflow`
  lock). The modal shows the image plus a `<dl>` of materials/year/dimensions. Items
  without detail fields are non‑interactive tiles.

Dependencies: `next/image` with local files. Missing image files would 404 at the
`<Image>` level (no guard) — see `TECHNICAL_DEBT.md`.

---

## 3. About page

**Route:** `/about` — `app/about/page.tsx`

Static server component: prose bio (Lombard, IL; design → build → install), a sticky
`DSC01558.webp` image, an embedded YouTube video
(`youtube-nocookie.com/embed/R8_fj2ljYIM`), and a horizontally scrolling strip of 10
hard‑coded workshop photos (the array mixes `.webp` and `.jpg` filenames). No data module;
everything is inline.

---

## 4. FAQ

**Route:** `/faq` — `app/faq/page.tsx`, `lib/faq-data.ts`

`faqItems` (18 Q&A pairs, covering board care, shipping, returns, laser engraving, wood
species, custom‑project pricing/lead time/deposits/installation) rendered as native
`<details>`/`<summary>` accordions with a rotating caret. `whitespace-pre-line` preserves
the `\n\n` paragraph breaks in the answer strings. Page‑level `metadata` is exported.
Fully static.

---

## 5. Product catalog

**Route:** `/shop` — `app/shop/page.tsx`, `components/ProductCard.tsx`, `lib/products.ts`, `data/products.json`

How it works:
- `getAllProducts()` (`lib/products.ts`) returns `data/products.json`'s `products` array
  (7 cutting boards). `getProductBySlug` / `getAllProductSlugs` also exist;
  `getAllProductSlugs` is currently unused.
- The page sorts a copy of the array: `status === "available"` first, then ascending
  `price_display` parsed by `toPriceNumber` (strips non‑`[0-9.-]`, non‑finite → `+∞`),
  then `title` alphabetical. Range prices like `"$175 - $290"` parse to `NaN` → `+∞` and
  sink to the bottom (see `TECHNICAL_DEBT.md`).
- Empty catalog renders a "Nothing here yet" state.
- `ProductCard` (server): thumbnail links to `/shop/[slug]`, badges from `badges[]`,
  clamped title/summary, `price_display`, and a `cta_primary` button (all current items:
  "Product Details" → `/shop/<slug>`). RapidAPI/tier branches never fire for this
  catalog.

Product record shape (`types/product.ts` + observed `products.json`): `slug`, `title`,
`summary`, `status` (`"available"` in all current data), `price_display`,
`shopify_product_id` (numeric string), `image_thumb`, `image_hero`, `badges`,
`cta_primary`, `features[]`, and optionally `shopify_handle` + `variants` (only
`large-endgrain-board` has `variants: { label: "Material", options: ["Maple","Cherry","Walnut"] }`).

---

## 6. Product detail page (PDP) + purchase

**Route:** `/shop/[slug]` — `app/shop/[slug]/page.tsx`
**Primary files:** `app/shop/[slug]/page.tsx`, `components/shopify/ShopifyProductBuyButton.tsx`, `types/shopify-buy-button.d.ts`

How it works:
- `params` is awaited (Next 16). Unknown slug → `notFound()`. `generateMetadata` builds
  title/description/OpenGraph from the product.
- Renders hero image (`image_hero ?? image_thumb`, `aspect-21/9`), badges, title, summary,
  and price (`price_display`, hidden when the product has variants).
- **Purchasability gate:** `isPurchasable = status === "available" && typeof
  shopify_product_id === "string" && shopify_product_id.length > 0`.
- `showOptions = hasVariants(variants)` — true only when `variants.options` is a non‑empty
  array (only `large-endgrain-board`).
- CTA logic:
  - `status === "coming-soon"` → no CTA (no current product uses this).
  - purchasable → `<ShopifyProductBuyButton productId={shopify_product_id} showOptions=…
    showPrice={showOptions} />`.
  - otherwise, if `cta_primary` exists → render it as a link (fallback "Request a quote"
    style path).
- A "Details" section lists `features[]` as bullets. A dormant "Pricing Tiers" section
  renders only for `pricing.provider === "rapidapi"` (unused).

**`ShopifyProductBuyButton` (client):**
- Loads the Shopify Buy Button SDK from `sdks.shopifycdn.com` (dedupes by `<script src>`;
  rejects on load error).
- Bails with `console.warn` if `NEXT_PUBLIC_SHOPIFY_DOMAIN` /
  `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` are missing.
- `sdk.buildClient({domain, storefrontAccessToken})` → `sdk.UI.onReady(client)` →
  `ui.createComponent("product", { id: productId, node, options })`.
- Component order is `["options","price","quantity","button"]` when `showPrice`, else
  `["options","quantity","button"]`. Explicitly avoids the `buttonWithQuantity` template.
- Styles are derived from the site's CSS variables via `getComputedStyle` (`hslVar`).
- Custom event handlers persist the quantity across the re‑renders Shopify triggers on
  variant change (`persistedQty`, `afterRender`, `addVariantToCart`, `updateQuantity`).
- On unmount / prop change it clears `node.innerHTML`.
- Add‑to‑cart opens Shopify's cart drawer; checkout navigates to Shopify‑hosted checkout.
  **The Next.js server is not involved in cart or checkout.**

Dependencies: Shopify store configured with matching numeric product IDs; the
`NEXT_PUBLIC_SHOPIFY_*` env vars; the shopifycdn script host.

---

## 7. Contact / quote request (lead capture with double opt‑in)

**Route:** `/contact` — `app/contact/page.tsx`, `components/ContactForm.tsx`
**Backend:** `app/api/contact/route.ts`, `app/api/contact/verify/route.ts`

Front end (`ContactForm`, client):
- Fields: first name, last name, email, phone (optional), message.
- `validate()` runs on every render (`useMemo`): names required; email must match
  `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; phone if present must have ≥10 digits; message 20–4000
  chars. Errors show after blur or after a submit attempt.
- On submit: POST JSON to `/api/contact`. Success → green "Check your email" banner using
  the server's `message`, form cleared. Failure → red banner with the server `error` or a
  generic message. Network error → "Network error. Please try again."

Back end — `POST /api/contact` (`runtime = "nodejs"`):
- Re‑validates email + message length (server‑side minimum is only 5 chars here, vs 20 in
  the client).
- `new Pool({ connectionString: DATABASE_URL || POSTGRES_URL, ssl: PGSSLMODE==="disable" ?
  false : { rejectUnauthorized: false } })` at module scope.
- Transaction: `INSERT INTO app.leads (…, verified=FALSE, source='contact', referer, ip,
  user_agent) RETURNING id`; then `INSERT INTO app.email_verification_tokens (lead_id,
  email, token_hash, expires_at)` with `expires_at = now + 24h`. `token_hash` =
  `sha256(hex)` of a `crypto.randomBytes(32).toString("base64url")` token.
- After commit: Resend `emails.send` with a confirm button/link to
  `{SITE_URL || derived}/api/contact/verify?token=<raw token>`.
- Missing `EMAIL_FROM` or `RESEND_API_KEY` → returns `ok: true` anyway (only logs).
- Any thrown error → `ROLLBACK`, 500 `{ ok:false, error:"Something went wrong…" }`.

Back end — `GET /api/contact/verify`:
- Missing token → 400 text.
- Transaction: `SELECT … FROM app.email_verification_tokens evt JOIN app.leads l …
  WHERE evt.token_hash=$1 AND evt.used_at IS NULL AND evt.expires_at > now() LIMIT 1`.
- No row → `ROLLBACK`, 400 text ("invalid or has expired… resubmit").
- If `!row.verified` → `UPDATE app.leads SET verified=TRUE, verified_at=now()`.
- Always `UPDATE app.email_verification_tokens SET used_at=now()`; commit.
- If `CONTACT_TO_EMAIL`, `EMAIL_FROM`, `RESEND_API_KEY` all present → Resend a "New
  verified inquiry" email to the shop containing name/email/phone/message (interpolated
  into HTML — see `TECHNICAL_DEBT.md`). Else `console.warn`.
- 302 → `/contact?confirmed=1`.

`/contact` page reads `searchParams`: `?confirmed=1` → green confirmation banner;
`?error=expired` / other → red banner. The verify route never actually redirects with
`?error=` (it returns plain‑text 400s), so that branch is currently unreachable.

Dependencies: PostgreSQL with a pre‑existing `app` schema; Resend; the `SITE_URL` /
`NEXT_PUBLIC_SITE_URL` env for correct link generation.

---

## 8. Global chrome: header, footer, layout, SEO

**Files:** `app/layout.tsx`, `components/Header.tsx`, `components/Footer.tsx`, `lib/site.ts`

- `layout.tsx`: Geist fonts as CSS vars; `<html lang="en" class="dark">`; conditional
  Google Tag Manager / gtag snippet gated on `NEXT_PUBLIC_GA_ID` (with `anonymize_ip`);
  `Header` + `<main class="mx-auto max-w-6xl px-4">` + `Footer`.
- `metadata`: title template `%s — <SITE.name>`, `metadataBase = new URL(SITE.url)`,
  OpenGraph, Twitter `summary_large_image` (`creator: "@3EF_Studio"`),
  `alternates.canonical = "/"` (static — every page reports canonical `/`; see debt).
- `Header`: sticky, scroll‑reactive background, responsive nav + mobile menu.
- `Footer`: blurb, page links, Instagram/Facebook/TikTok, dynamic year, 3EF credit.

No `sitemap.ts`, `robots.ts`, `manifest`, or per‑page canonical overrides.

---

## 9. Analytics hooks (present, not active)

**Files:** `lib/analytics.ts`, `components/ClientEvent.tsx`, `components/CtaTrack.tsx`, `components/NewsletterForm.tsx`, `components/LeadForm.tsx`

`track()` and the helper components call `window.plausible(...)` only if it is a function.
**No Plausible script is loaded anywhere in the app**, so every call is a silent no‑op.
Google Analytics *can* be enabled by setting `NEXT_PUBLIC_GA_ID` (`app/layout.tsx`), but
none of the custom events are wired to GA — they only target Plausible. See
`INTEGRATIONS.md` / `OPERATIONS.md`.

---

## Feature dependency map

- **Home → Gallery:** featured items and CTAs deep‑link into `/gallery2`.
- **Home / Gallery → Contact:** "Request a quote" buttons.
- **Catalog → PDP:** `ProductCard` and `cta_primary` link by `slug`; PDP re‑reads the
  same `products.json` record.
- **PDP → Shopify:** purchase depends on `shopify_product_id` in `products.json` matching
  a live Shopify product and on the `NEXT_PUBLIC_SHOPIFY_*` env vars + the shopifycdn
  script.
- **Contact form → `/api/contact` → Postgres + Resend → `/api/contact/verify` → Postgres +
  Resend → `/contact?confirmed=1`.** Every step after the DB insert degrades to
  "logged and ignored" if email env vars are missing.
- **Unused/orphaned:** `LeadForm`, `NewsletterForm`, `ProjectCard`, `ClientEvent`,
  `CtaTrack`, `ConfigurableAddToCart`, `buyButtonUI.ts`, `lib/portfolio.ts`,
  `lib/newsletter/dde.ts`, `/api/shopify/cart`, `/api/shopify/product`, `theme-a.css`,
  `theme-c.css`, `/gallery1`.
