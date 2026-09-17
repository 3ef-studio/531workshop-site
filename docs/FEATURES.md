# FEATURES — 531 Workshop Site

_Last reviewed: 2026-09-11. Each feature is described as implemented._

---

## 1. Home / landing page

**Route:** `/` — `app/page.tsx` (async server component)
**Primary files:** `app/page.tsx`, `components/Hero.tsx`, `lib/hero-data.ts`,
`components/TestimonialsCarousel.tsx`, `components/ProductCard.tsx`, `lib/home-data.ts`

### Hero (rotating)

`Hero` (client component) rotates through a small, hand-picked set of Gallery project
photos instead of one static image:

- `lib/hero-data.ts` defines `HERO_SLIDE_IDS` (currently 4 ids) and
  `HERO_ROTATION_INTERVAL_MS` (15,000ms). Slides are resolved against the existing
  `GALLERY_IMAGES` catalog by `id` — titles, descriptions, and images are reused, not
  duplicated. An id that doesn't resolve is skipped with a dev-only `console.warn`; if
  every id fails to resolve, a hard-coded fallback image renders instead of a broken hero.
- Auto-advances every `HERO_ROTATION_INTERVAL_MS` unless the visitor has interacted with
  any rotation control (permanently pauses) or the browser reports
  `prefers-reduced-motion: reduce` (detected via `useSyncExternalStore`, not a
  `useMemo`/effect read, to avoid a stale value surviving hydration).
- Prev / dot-pagination / next / pause‑resume controls, plus an "i" info toggle showing the
  active slide's title/description, are rendered in **two** places — one cluster overlaid
  on the photo (desktop, `hidden sm:flex`) and a duplicate below the image on plain
  background (mobile, `flex sm:hidden`). The info toggle itself is desktop‑only.
- Two CTAs: **"View Our Work"** always links to `/gallery`. **"Start a Custom Project"**
  links to `` `/contact?project=${activeSlide.slug}` `` — i.e. it is contextual to
  whichever photo is currently showing, and falls back to plain `/contact` if the active
  slide has no slug.
- Headline: "Crafted for you and your home." / subtext: "Custom built, designed to last a
  lifetime." No eyebrow text.

### Value props + Shop preview + testimonials

- "Custom Projects" section maps `VALUE_PROPS` (3 items) from `lib/home-data.ts` into
  cards, followed by a "Request a quote" button linking to `/contact`.
- **"Shop" preview** replaces the old "Featured work" section. `FEATURED_PRODUCT_SLUGS`
  (`lib/home-data.ts`) lists which products from the real catalog to feature — the page
  resolves each via `getProductBySlug` and renders them with the **same** `ProductCard`
  component used on `/shop` (no duplicated card markup). An unresolvable slug is dropped
  silently in production and warned about in dev. "View All Products" links to `/shop`.
  Custom-project inspiration is handled by the Gallery, not this section — this preview is
  purely a Shop entry point.
- "What clients say" shows a static 5‑star glyph, `TESTIMONIAL_META.rating` (4.9) and
  `TESTIMONIAL_META.count` (18) — note only 5 testimonials exist in `TESTIMONIALS` — then
  renders `TestimonialsCarousel`.

`TestimonialsCarousel` (client): responsive slides‑per‑view (1 / 2), pointer‑drag swipe
with an 80px‑or‑8vw threshold, ArrowLeft/ArrowRight when focused, dot pagination, and a
`prefers-reduced-motion` check (an older `useMemo`-based pattern, not yet updated to match
`Hero.tsx`'s `useSyncExternalStore` approach — see `TECHNICAL_DEBT.md` E5).

---

## 2. Gallery (project showcase)

**Routes:** `/gallery` (landing), `/gallery/[category]` (one per category),
`/gallery/[category]/[slug]` (one per project) — all linked from nav + footer + home
**Primary files:** `app/gallery/page.tsx`, `app/gallery/[category]/page.tsx`,
`app/gallery/[category]/[slug]/page.tsx`, `components/GalleryCard.tsx`,
`lib/gallery-data.ts`

`app/gallery2/page.tsx` (the previous primary gallery) has been **deleted**; `/gallery2`
now permanently redirects (308) to `/gallery` via `next.config.ts`. `app/gallery1/page.tsx`
(a pre-existing, unlinked design alternative) is untouched and out of scope — see
`TECHNICAL_DEBT.md`.

### Data model

`GALLERY_IMAGES` (`lib/gallery-data.ts`, 23 entries) is the single source of truth. Each
entry has:
- `id` — the original stable identifier, kept so `lib/hero-data.ts`'s existing
  `HERO_SLIDE_IDS` list doesn't need updating.
- `slug` — a new, URL-facing, human-readable identifier used for routing and for the
  Contact project-inquiry handoff. Treat as a public URL once shipped.
- `category` — exactly **one** primary `GalleryCategory`
  (`"tables" | "cabinets" | "specialty-projects" | "commercial-projects" |
  "cutting-boards"`), which determines the item's `/gallery/[category]` page and canonical
  project URL. `tags[]` remains available for secondary/free-form classification and does
  not affect routing.
- `src`, `alt`, and optional `title`, `description`, `materials[]`, `year`, `dimensions`,
  `featured`.

`CATEGORIES` is the single place category values map to display labels — the landing
page's category nav, category pages, and `generateMetadata` calls all read from it rather
than re-declaring labels. Helpers: `isGalleryCategory`, `getCategoryLabel`,
`getGalleryItemsByCategory(category)`, `getGalleryItemBySlug(category, slug)`, and
`findGalleryProjectBySlug(slug)` — a slug-only lookup (category unknown) used by `/contact`
to resolve `?project=<slug>`, since only the slug travels in that URL.

Three "Cutting Boards" entries (`large-end-grain-cutting-board`,
`large-cutting-board-with-juice-groove`, `large-cutting-board-with-round-handle`)
deliberately reuse existing Shop product photography as craftsmanship examples — they carry
no price and no purchase link, and are visually and structurally distinct from a
purchasable Shop listing (see "Gallery vs. Shop" below).

### Pages

- **`/gallery`** — a category-navigation strip (one representative photo + project count
  per category, linking to `/gallery/[category]`) above a full CSS‑grid mosaic of every
  item (`getMosaicSpan(index)` gives some tiles `col-span-2`/`row-span-2` based on
  `index % 12`). Each tile links to its own `/gallery/[category]/[slug]` page. Also embeds
  a YouTube video (`youtube-nocookie.com/embed/wQ63sQTePeE`) and a "Request a quote" button
  to `/contact`.
- **`/gallery/[category]`** — breadcrumb, heading, and a plain grid of that category's
  items (`notFound()` for an unrecognized category segment). `generateMetadata` sets a
  per-category title/description and canonical.
- **`/gallery/[category]/[slug]`** — breadcrumb, hero image, title, description, and (when
  present) a Details `<dl>` of materials/year/dimensions. `notFound()` fires for an unknown
  category, an unknown slug, *or* a real slug requested under the wrong category (the URL's
  category segment must match the item's actual category). Ends with a "Like this project?"
  card and an **"I want something like this"** button →
  `` `/contact?project=${item.slug}` `` — this is the only piece of Gallery data that
  travels to Contact; the client never sends title/category. `generateMetadata` sets a
  per-project title/description/canonical/OpenGraph.
- **`/gallery1`** — unchanged: a plain 2‑column grid, `aspect="landscape"`, titles always
  shown, no click‑through (rendered via `GalleryCard` with no `href`, so tiles are
  non‑interactive). No navigation links to it; reachable only by direct URL.

`GalleryCard` (client): the image tile. Passing an `href` prop makes the whole tile a
`<Link>` to a project page (used everywhere in the new Gallery); omitting it renders a
plain, non-interactive tile (used only by `/gallery1`). **The click-to-open detail modal
that previously existed here has been removed entirely** — there is no `role="dialog"`
anywhere in this component anymore; project detail lives on a real, indexable page instead.

### Gallery vs. Shop

These are two intentionally distinct catalogs sharing no data:
- **Gallery** (`lib/gallery-data.ts`) — a portfolio of one-off custom work, organized by
  project category, meant to inspire a custom-project inquiry via Contact. No prices, no
  purchase flow.
- **Shop** (`data/products.json` via `lib/products.ts`) — a small catalog of *purchasable*
  cutting boards with Shopify-backed pricing/checkout.

The three cutting-board Gallery entries described above are the one place their imagery
overlaps (by design, to avoid re-shooting products already photographed for Shop) — they
still render through the plain Gallery card/page path with no pricing or Buy Button UI.

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
  (7 cutting boards). `getProductBySlug` (also used by the homepage Shop preview) /
  `getAllProductSlugs` also exist; `getAllProductSlugs` is currently unused.
- The page sorts a copy of the array: `status === "available"` first, then ascending
  `price_display` parsed by `toPriceNumber` (strips non‑`[0-9.-]`, non‑finite → `+∞`),
  then `title` alphabetical. Range prices like `"$175 - $290"` parse to `NaN` → `+∞` and
  sink to the bottom (see `TECHNICAL_DEBT.md`).
- Empty catalog renders a "Nothing here yet" state.
- `ProductCard` (server): thumbnail links to `/shop/[slug]`, badges from `badges[]`,
  clamped title/summary, `price_display`, and a `cta_primary` button (all current items:
  "Product Details" → `/shop/<slug>`). RapidAPI/tier branches never fire for this
  catalog. This is the same component reused verbatim for the homepage Shop preview.

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

## 7. Contact / project inquiry (lead capture with double opt‑in)

**Route:** `/contact` — `app/contact/page.tsx`, `components/ContactForm.tsx`
**Backend:** `app/api/contact/route.ts`, `app/api/contact/verify/route.ts`

### Two entry modes

- **Generic:** visiting `/contact` directly. The form renders with no project context and
  all optional fields blank.
- **Gallery-inspired:** arriving via `` `/contact?project=<slug>` `` — from a Gallery
  project page's "I want something like this" CTA or the Hero's "Start a Custom Project"
  CTA. `app/contact/page.tsx` resolves the slug server-side
  (`findGalleryProjectBySlug`); an unknown/stale slug (bad link, renamed/removed project)
  simply falls back to the generic experience — no error state. A resolved project renders
  a compact context card (photo, title, category) above the form, and the form's Project
  type select is preselected to that project's category.

Only the slug ever appears in the URL or travels client→server — the page and the API
route each independently re-resolve title/category from the trusted `GALLERY_IMAGES` data,
never from anything the client sent.

### Front end (`ContactForm`, client)

Fields:
- **First name**, **Last name**, **Email**, **Tell us about your project** (message) —
  required.
- **Phone**, **Project type** (a `<select>` sourced from `lib/contactOptions.ts`'s
  `PROJECT_TYPE_OPTIONS`, i.e. every Gallery category plus "Other"), **Approximate size**
  (free text, capped at `MAX_DIMENSIONS_LENGTH` = 200 chars), **Timeframe** (a `<select>`
  of 4 fixed options) — optional.

Validation (`lib/contactValidation.ts`, extracted to a pure, unit-tested function): names
required; email must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; phone if present must have ≥10
digits; message 20–4000 chars; dimensions bounded but otherwise free-form. Errors show
after blur or after a submit attempt, using accessible `aria-invalid`/`aria-describedby`
wiring (`useId`-derived ids). On submit: POST `{...values, projectSlug, referenceId}` JSON
to `/api/contact` — `referenceId` is a hidden honeypot **`<select>`** (not a text input;
visually hidden off-screen, `aria-hidden`, excluded from the tab order), deliberately
chosen over a text field after a 2026-09-14 false positive where Chrome's own autofill
populated an earlier text-input honeypot for a legitimate visitor — see
`TECHNICAL_DEBT.md` A1. Browsers don't guess-fill arbitrary hidden dropdowns the way they
do text fields, so it stays at its blank default for a real visitor, while still matching
the one bot pattern actually observed (always picking a `<select>`'s first non-blank
option). Success → green "Check your email" banner using the server's `message`, form
cleared. Failure → red banner with the server `error` or a generic message. Network
error → "Network error. Please try again."

### Back end — `POST /api/contact` (`runtime = "nodejs"`)

- **Honeypot check (first thing, before any other validation):** the payload's
  `referenceId` field is a hidden form input a real visitor never sees or fills (see
  `ContactForm` below). Any non-empty value there makes the route return the exact same
  success response as a normal submission (`{ok:true, message:"Submitted. Please check
  your email to confirm."}`) **without** opening a DB transaction, inserting a lead,
  creating a verification token, or calling Resend — so an automated submitter gets no
  signal that anything was detected. Added 2026-09-14 in response to a confirmed
  automated-spam wave — see `docs/CONTACT_SPAM_INVESTIGATION.md`.
- Re‑validates email; message length is enforced at 20–4000 characters
  (`lib/contactValidation.ts`'s `MIN_MESSAGE_LENGTH`/`MAX_MESSAGE_LENGTH`), the same window
  the client enforces — previously the server minimum was only 5 characters with no
  maximum (see `TECHNICAL_DEBT.md` A5, now resolved).
- **Content-shape check:** a message of 20+ characters that contains no whitespace at all
  is rejected (`messageHasNoWhitespace`, `lib/contactValidation.ts`) — a narrow,
  deterministic rule matching the exact shape of the spam wave's junk messages (a single
  random alphanumeric token, no spaces). It intentionally does not apply to the
  `dimensions` field (a legitimate value like `72x36x30` has no whitespace) and is not a
  general gibberish or language detector — see `TECHNICAL_DEBT.md` A13 for its documented
  scope/limitations.
- **Rejection safety net:** both the honeypot short-circuit above and this content-shape
  rejection also insert a row into `app.contact_rejections` (`logRejectedSubmission`) —
  the reason, the submitted name/email/phone/message/project fields, the honeypot's actual
  value when relevant, and referer/ip/user-agent. This never creates a lead and never
  sends email; it exists purely so a false positive (see `TECHNICAL_DEBT.md` A1) can be
  caught and the customer followed up with by hand instead of silently lost. A failure
  while logging is caught internally and never changes the response the requester sees.
  The plain too-short/too-long message-length rejections below are **not** logged here —
  the submitter already sees those as an ordinary form error.
- Builds a `project_context` object server-side (`buildProjectContext`): resolves
  `gallerySlug`/`galleryTitle`/`galleryCategory` from the submitted `projectSlug` (silently
  ignored if unresolvable), validates `projectType`/`timeframe` against
  `lib/contactOptions.ts` (silently dropped if invalid — these are low-stakes optional
  fields; the submission is not rejected over them), and truncates `dimensions`. An
  entirely-empty context serializes to `null`.
- `new Pool({ connectionString: DATABASE_URL || POSTGRES_URL, ssl: PGSSLMODE==="disable" ?
  false : { rejectUnauthorized: false } })` at module scope.
- Transaction: `INSERT INTO app.leads (…, verified=FALSE, source='contact', referer, ip,
  user_agent, project_context) RETURNING id`; then `INSERT INTO
  app.email_verification_tokens (lead_id, email, token_hash, expires_at)` with
  `expires_at = now + 24h`. `token_hash` = `sha256(hex)` of a
  `crypto.randomBytes(32).toString("base64url")` token. **Requires the target database's
  `app.leads` table to have a nullable `project_context JSONB` column** — applied to
  production out-of-band; not tracked by any migration in this repo (see
  `TECHNICAL_DEBT.md` A8).
- After commit: Resend `emails.send` with a confirm button/link to
  `{SITE_URL || derived}/api/contact/verify?token=<raw token>`.
- Missing `EMAIL_FROM` or `RESEND_API_KEY` → returns `ok: true` anyway (only logs).
- Any thrown error → `ROLLBACK`, 500 `{ ok:false, error:"Something went wrong…" }`.

### Back end — `GET /api/contact/verify`

- Missing token → 400 text.
- Transaction: `SELECT … FROM app.email_verification_tokens evt JOIN app.leads l …
  WHERE evt.token_hash=$1 AND evt.used_at IS NULL AND evt.expires_at > now() LIMIT 1`
  (now also selecting `l.project_context`).
- No row → `ROLLBACK`, 400 text ("invalid or has expired… resubmit").
- If `!row.verified` → `UPDATE app.leads SET verified=TRUE, verified_at=now()`.
- Always `UPDATE app.email_verification_tokens SET used_at=now()`; commit.
- If `CONTACT_TO_EMAIL`, `EMAIL_FROM`, `RESEND_API_KEY` all present → Resend a "New
  verified inquiry" email to the shop. The email:
  - HTML-escapes every user-supplied/free-text value (name, email, phone, message,
    dimensions) via a local `escapeHtml()` helper — the plain-text subject-line name is
    intentionally left unescaped, since a mail header isn't HTML.
  - Presentation-formats the phone number for known 10/11-digit US formats
    (`formatPhoneForDisplay`), leaving anything else as entered.
  - Formats the submitted-at timestamp in `America/Chicago` via `Intl.DateTimeFormat`
    (`formatBusinessTimestamp`) — correct across DST without manual offset math.
  - Renders a project-context block (`renderProjectContext`) only when one exists, showing
    only the fields actually present ("Inspired by:" title, "Category:", "Project type:",
    "Approx. dimensions:", "Timeframe:") — and suppressing "Category:" specifically when it
    equals the customer's selected "Project type:" (avoids showing the same word twice).
  - **Does not currently set a `Reply-To` header to the customer's email** — the shop owner
    can read the customer's email address in the body but can't just hit "Reply" to respond
    directly. See `TECHNICAL_DEBT.md` (new item).
  Else `console.warn`.
- 302 → `/contact?confirmed=1`.

`/contact` page reads `searchParams`: `?confirmed=1` → green confirmation banner;
`?error=expired` / other → red banner; `?project=<slug>` → Gallery context card (above).
The verify route never actually redirects with `?error=` (it returns plain‑text 400s), so
that branch is currently unreachable.

Dependencies: PostgreSQL with a pre‑existing `app` schema (including `project_context`);
Resend; the `SITE_URL` / `NEXT_PUBLIC_SITE_URL` env for correct link generation.

---

## 8. Global chrome: header, footer, layout, SEO

**Files:** `app/layout.tsx`, `components/Header.tsx`, `components/Footer.tsx`, `lib/site.ts`,
`app/sitemap.ts`, `app/robots.ts`

- `layout.tsx`: Geist fonts as CSS vars; `<html lang="en" class="dark">`; conditional
  Google Tag Manager / gtag snippet gated on `NEXT_PUBLIC_GA_ID` (with `anonymize_ip`);
  `Header` + `<main class="mx-auto max-w-6xl px-4">` + `Footer`.
- `metadata`: title template `%s — <SITE.name>`, `metadataBase = new URL(SITE.url)`,
  OpenGraph, Twitter `summary_large_image` (`creator: "@3EF_Studio"`). There is no global
  `alternates.canonical` — every indexable route sets its own via a page-level `metadata`
  export or `generateMetadata` (home, about, faq, gallery, gallery category, gallery
  project, shop, shop PDP, contact).
- `Header`: sticky, scroll‑reactive background, responsive nav + mobile menu ("Custom
  Gallery" → `/gallery`).
- `Footer`: blurb, page links (Gallery → `/gallery`), Instagram/Facebook/TikTok, dynamic
  year, 3EF credit.
- `app/sitemap.ts` (→ `/sitemap.xml`): the static indexable routes, every product detail
  page, every Gallery category page, and every Gallery project page — derived from
  `lib/gallery-data.ts`'s `CATEGORIES` and `GALLERY_IMAGES` rather than hand-listed, so a
  new Gallery item is automatically included. Intentionally excludes `/gallery1` (unlinked
  legacy route) and `/gallery2` (retired, now a redirect).
- `app/robots.ts` (→ `/robots.txt`): `Allow: /`, `Disallow: /api/`, points at the sitemap.

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

- **Home → Gallery:** the Hero's "View Our Work" CTA and its contextual "Start a Custom
  Project" CTA (deep-linking a specific Gallery slug into `/contact`).
- **Home → Shop:** the Shop preview section (real products, real `ProductCard`) and "View
  All Products" both link into `/shop`.
- **Gallery project page → Contact:** "I want something like this" →
  `/contact?project=<slug>`, resolved server-side on both ends.
- **Home / Gallery / FAQ → Contact:** "Request a quote" buttons (generic mode, no slug).
- **Catalog → PDP:** `ProductCard` and `cta_primary` link by `slug`; PDP re‑reads the
  same `products.json` record.
- **PDP → Shopify:** purchase depends on `shopify_product_id` in `products.json` matching
  a live Shopify product and on the `NEXT_PUBLIC_SHOPIFY_*` env vars + the shopifycdn
  script.
- **Contact form → `/api/contact` → Postgres + Resend → `/api/contact/verify` → Postgres +
  Resend → `/contact?confirmed=1`.** Every step after the DB insert degrades to
  "logged and ignored" if email env vars are missing.
- **Unused/orphaned:** `LeadForm`, `NewsletterForm`, `ProjectCard`, `types/project.ts`,
  `ClientEvent`, `CtaTrack`, `ConfigurableAddToCart`, `buyButtonUI.ts`, `lib/portfolio.ts`,
  `lib/newsletter/dde.ts`, `/api/shopify/cart`, `/api/shopify/product`, `theme-a.css`,
  `theme-c.css`, `/gallery1`.
</content>
