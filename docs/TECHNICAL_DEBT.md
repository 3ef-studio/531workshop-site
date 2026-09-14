# TECHNICAL DEBT / RISK REGISTER — 531 Workshop Site

_Last reviewed: 2026-09-11 (Gallery/Hero/Contact-enhancement reconciliation); F1 updated
2026-09-04. This is an inventory;
fixes happen in later, scoped missions. Items are grouped by area and each is tagged
**[Confirmed]** (verified in the code), **[Investigate]** (needs runtime checking or
product context), **[Resolved <date>]** (fixed in a later mission, with a note on how), or
**[Deferred <date>]** (evaluated and consciously left as-is, with the reasoning and what
to watch for noted)._

---

## A. Lead capture / contact API

### A1. No rate limiting or CAPTCHA on the live contact form — **[Partially Resolved 2026-09-14]**
Following a confirmed automated-spam wave (see `docs/CONTACT_SPAM_INVESTIGATION.md`),
`components/ContactForm.tsx` now includes a hidden honeypot field (`referenceId`) and
`app/api/contact/route.ts` silently accepts-and-discards any submission that fills it — no
DB write, no verification token, no Resend call. This targets the specific bot profile
observed in the investigation (an unsophisticated tool with no evidence of avoiding hidden
fields).

**Known false-positive, fixed same day:** the honeypot originally shipped as a hidden text
`<input>`, hidden via off-screen CSS positioning. Within hours of deploying, a real
visitor's plain Chrome autofill (no password manager or extension involved) populated it,
silently discarding a legitimate submission with no error shown to the user and no lead
ever created. Chrome's form-fill-prediction targets text-like inputs regardless of
on-screen visibility, so off-screen positioning alone doesn't defend against it. **Fixed**
by changing the honeypot to a hidden `<select>` instead — browsers don't guess-fill
arbitrary hidden dropdowns the way they do text fields, and a `<select>` still matches the
one bot pattern actually observed (it always picked a dropdown's first non-blank option).
The server-side check is unchanged (same "non-empty value = discard" logic regardless of
input type). No automated test currently exercises real browser autofill behavior — this
was caught by manual production testing, not the test suite; that's a gap worth being
aware of if this technique is revisited again.

**Rate limiting and CAPTCHA/Turnstile remain absent** — the investigation found the
observed traffic came from ~15 distinct IPs (several via known Tor exit ranges) with low
per-IP repetition, making simple per-IP rate limiting a weak fit for what was actually
seen, and found no evidence the bot is sophisticated enough to require a CAPTCHA-grade
challenge. Both remain explicit, evidence-gated Stage 2 options — see the investigation
report's §7 for the staging rationale — not implemented here. `components/LeadForm.tsx`
(dead code, unused) still has its own, separate `company` honeypot precedent that predates
this work.

### A2. Email templates interpolate unescaped user input — **[Resolved 2026-09-10]**
`app/api/contact/verify/route.ts` now runs every user-supplied/free-text value (name,
email, phone, message, and any project-context `dimensions`) through a local
`escapeHtml()` helper before interpolating it into the internal notification's HTML. The
plain-text subject-line name is intentionally left unescaped (a mail header isn't HTML, so
escaping it would show literal `&amp;`-style entities to the recipient). The customer-facing
confirmation email (`app/api/contact/route.ts`) never interpolates user-supplied data into
its HTML, so it was never at risk. Covered by `test/api-contact-verify.test.ts` (HTML/script
injection in `message`, `dimensions`, name/phone all assert escaped output).

### A3. Resend send outcome is not checked; failures are invisible to the user — **[Confirmed — observed at runtime 2026-08-28]**
Both routes `await resend.emails.send(...)` but **never inspect the returned `{ data,
error }` object** — they only handle a *thrown* exception. The Resend SDK does not throw
on API‑level errors (422, 429, domain‑unverified, 5xx); it resolves with `error` set.

- **Observed:** a local `POST /api/contact` probe committed the lead + token, called
  Resend, received **HTTP 422** (`test@example.com` is a rejected test recipient), and the
  route still returned `{ ok: true, message: "check your email…" }`. The user is told to
  check an inbox that received nothing, and there is no log line for the failure.
- A *thrown* error (e.g. network failure) instead hits the outer `catch`, which runs
  `client.query("ROLLBACK")` (a no‑op after `COMMIT`) and returns 500: on
  `POST /api/contact` the user sees "Something went wrong" but the lead rows exist; on
  `GET /api/contact/verify` the lead is already `verified` but the user gets a plain‑text
  500 instead of `/contact?confirmed=1` and the owner notification may not have been sent.
- No retry, no alerting, no "resend confirmation" path.

Fix must branch on the Resend `error` field, not just `try/catch`.

### A4. Missing email env vars fail silently as "success" — **[Confirmed]**
`app/api/contact/route.ts:121-131`: if `EMAIL_FROM` or `RESEND_API_KEY` is missing the
route still returns `{ ok: true, message: "check your email…" }`. The user waits for a
confirmation email that will never arrive, and the lead can never be verified (so the
owner is never notified). Only a `console.error` marks this.

### A5. Client and server validation disagree — **[Resolved 2026-09-14, partially]**
The message-length half of this gap is fixed: `app/api/contact/route.ts` now enforces the
same 20–4000 character window as the client (`lib/contactValidation.ts`'s
`MIN_MESSAGE_LENGTH`/`MAX_MESSAGE_LENGTH`, imported by both), closing the gap that let the
2026-09 spam wave's 20+-character junk messages clear a 5-character server floor trivially.
**First/last name are still optional server-side** (the client requires them) — that part
of the original gap remains open; it wasn't implicated in the investigated spam (the bot
always supplied *some* name) and was out of scope for the spam-focused Stage 1 fix.

### A6. `pg` `Pool` created per route module under serverless — **[Investigate]**
`app/api/contact/route.ts:16` and `app/api/contact/verify/route.ts:8` each do
`new Pool(...)` at module scope with no `max`/idle settings. On a serverless platform
(Vercel) each concurrent instance opens its own pool; bursts can exhaust Postgres
connections. Confirm the DB is fronted by a pooler (PgBouncer / Neon pooled endpoint) or
switch to a serverless‑friendly client.

### A7. TLS certificate verification disabled for Postgres — **[Confirmed]**
`ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }`. The
non‑disabled path still accepts any certificate, so the DB connection is not protected
against MITM. Acceptable only if the network path is fully trusted; otherwise pin the CA.

### A8. Database schema is not in the repo — **[Confirmed]**
`app.leads` and `app.email_verification_tokens` (and columns like `verified_at`) are
assumed to exist. No migrations, no schema SQL, no seed. New environments cannot be stood
up from this repo alone, and column/constraint drift is invisible to code review. The
Contact project-inquiry enhancement added a further undertracked dependency: `app.leads`
must also have a nullable `project_context JSONB` column (`ALTER TABLE app.leads ADD
COLUMN project_context JSONB;`), applied to production out-of-band with no migration
record anywhere in this repo.

### A9. Verification route never triggers the page's `?error=` UI — **[Confirmed]**
`app/contact/page.tsx` handles `?error=expired` / other, but
`app/api/contact/verify/route.ts` returns bare plain‑text 400s for
invalid/expired/missing tokens and only ever redirects on success. The error‑banner code
path on `/contact` is dead, and users who click a stale link get an unstyled text page.

### A10. Stored PII with no privacy policy — **[Confirmed]**
The API stores `ip`, `user_agent`, and `referer` alongside name/email/phone/message. The
site has **no `/privacy` route** and no cookie/consent notice. Review against GDPR/CCPA
obligations for the business.

### A11. Verification token travels in the URL query string — **[Investigate]**
`/api/contact/verify?token=<raw>`. Query‑string secrets can land in access logs and
`Referer` headers. The endpoint redirects immediately and the token is single‑use +
24h‑scoped, so exposure is limited, but a POST body or path segment would be cleaner.

### A12. Internal notification email has no `Reply-To` set to the customer — **[Confirmed]**
`app/api/contact/verify/route.ts`'s `resend.emails.send({...})` call for the internal
"New verified inquiry" notification does not set a `replyTo` field. The customer's email
address is visible in the rendered body, but the shop owner can't just hit "Reply" in their
mail client to respond directly to the customer — they have to copy the address out
manually first. Low severity (a workaround exists), but a real, currently-unaddressed
usability gap. Fix: add `replyTo: row.email` (unescaped — the SDK sets a real header field,
not HTML) to the `emails.send` call.

### A13. The message content-shape spam check is intentionally narrow — **[Deferred, by design]**
`lib/contactValidation.ts`'s `messageHasNoWhitespace` (used by `app/api/contact/route.ts`)
rejects a message that is a single unbroken run of characters with no whitespace, 20+
characters long — an exact match for the one bot pattern documented in
`docs/CONTACT_SPAM_INVESTIGATION.md`. It is not a general gibberish/entropy/language
detector, and a bot that appends even one space to an otherwise-random string defeats it
entirely (this is asserted directly in `test/contactValidation.test.ts` as a documented
limitation, not an oversight). This was a deliberate scope decision for the Stage 1 fix,
not a bug — revisit only if evidence emerges of spam that this rule doesn't catch.

---

## B. Dead / orphaned code

### B1. Two unused Shopify server routes — **[Confirmed]**
`app/api/shopify/cart/route.ts` is called by nothing. `app/api/shopify/product/route.ts`
is called only by `components/shopify/ConfigurableAddToCart.tsx`, which is imported
nowhere. They ship as live, publicly reachable endpoints (the `cart` route also sets a
cookie) but serve no feature. Either finish the custom cart UI or delete the routes +
`ConfigurableAddToCart.tsx` + `components/shopify/buyButtonUI.ts`.

### B2. Forms that POST to non‑existent endpoints — **[Confirmed]**
`components/LeadForm.tsx` → `POST /api/lead`, `components/NewsletterForm.tsx` →
`POST /api/subscribe`. Neither route exists. Both components are currently unrendered, so
this is latent, but anyone re‑adding them to a page ships a broken form.

### B3. Template leftovers from another 3EF project — **[Confirmed]**
`lib/portfolio.ts` (VeilMark / DDE / csv‑tools portfolio content), `lib/newsletter/dde.ts`
(reads `data/dde/**` JSON that isn't in the repo), `components/ProjectCard.tsx` (links to
`/projects/[slug]`, which doesn't exist — unrelated to the newer Gallery "project" concept
introduced by `/gallery/[category]/[slug]`, despite the name collision), `types/project.ts`
(the same unrelated `Project` shape backing `ProjectCard`, also unused), `components/ClientEvent.tsx`,
`components/CtaTrack.tsx`, and the `pricing: { provider: "rapidapi", tiers }` machinery in
`types/product.ts` / `ProductCard` / the PDP. None of it is reachable from this site.

### B4. Unused route and CSS — **[Confirmed]**
`app/gallery1/page.tsx` is a live route with no navigation to it (a design alternative
left in place, out of scope for the Gallery v2 rebuild). `app/gallery2/page.tsx` (the
former primary gallery) has since been **deleted** — `/gallery2` now permanently redirects
to `/gallery` (`next.config.ts`), so it is retired rather than orphaned. `app/theme-a.css`
and `app/theme-c.css` are never imported (only `theme-b.css` is). `FEATURED_GALLERY_IMAGES`
(`lib/gallery-data.ts`) and `getAllProductSlugs` (`lib/products.ts`) are unused exports —
note the Hero rotation (`lib/hero-data.ts`) resolves its slides via an explicit
`HERO_SLIDE_IDS` list, not via `FEATURED_GALLERY_IMAGES`, so this export remains genuinely
unused rather than newly consumed.

### B5. Duplicate PostCSS config — **[Confirmed]**
Both `postcss.config.cjs` and `postcss.config.mjs` exist with identical content. Keep one.

---

## C. Analytics

### C1. Plausible is referenced everywhere but never loaded — **[Confirmed]**
`lib/analytics.ts`, `ClientEvent`, `CtaTrack`, `LeadForm`, `NewsletterForm` all call
`window.plausible(...)`. No `<script>` for Plausible exists in `app/layout.tsx` or
anywhere else, so `window.plausible` is always undefined and **every analytics event is
silently dropped**. Either add the Plausible script or remove the tracking code.

### C2. Google Analytics wired but off, and disconnected from the custom events — **[Confirmed]**
`app/layout.tsx` only injects `gtag.js` when `NEXT_PUBLIC_GA_ID` is set (not in the
committed `.env`). Even when enabled, none of the app's custom events target GA — they
target Plausible only. So the business currently has **no working analytics** on
conversions (quote requests, add‑to‑cart).

---

## D. SEO / metadata

### D1. Every page declares canonical `/` — **[Resolved 2026-08-28]**
`app/layout.tsx:20` set `alternates: { canonical: "/" }` globally and no page overrode
it (`app/shop/[slug]/page.tsx`'s `generateMetadata` set `openGraph.url` but not
`alternates.canonical`). Search engines were told that `/shop`, `/about`, every PDP, etc.
are all duplicates of the homepage, suppressing indexing of interior pages.
**Fix:** the global `alternates` block was removed from `app/layout.tsx`; each indexable
route now sets its own `alternates.canonical` — `app/page.tsx` (`/`), `app/about/page.tsx`,
`app/faq/page.tsx`, `app/shop/page.tsx`, `app/contact/page.tsx`, and `app/shop/[slug]/page.tsx`
via `generateMetadata` (`/shop/<slug>`). Canonicals resolve against the existing
`metadataBase` (`lib/site.ts`). **Since resolved:** the gallery rebuild extended this same
pattern to the new route tree — `app/gallery/page.tsx` (`/gallery`),
`app/gallery/[category]/page.tsx`, and `app/gallery/[category]/[slug]/page.tsx` (both via
`generateMetadata`) all set their own canonical; `/gallery2` no longer exists as a page
(retired, now a redirect — see B4). `/gallery1` was left without a canonical (unlinked
internal route — see B4). Verified in built/served HTML; regression tests in
`e2e/seo.spec.ts`.

### D2. No `sitemap.ts`, `robots.ts`, or `robots.txt` — **[Resolved 2026-08-28]**
Nothing guided crawlers. **Fix:** added `app/sitemap.ts` (Next metadata route → `/sitemap.xml`)
listing the indexable static routes plus every product detail page derived from
`data/products.json` via `getAllProducts()`; it excludes `/gallery1`, `/gallery2`, API
routes, and framework routes. Added `app/robots.ts` (→ `/robots.txt`): `Allow: /`,
`Disallow: /api/`, and a `Sitemap:` pointer. Both use the site URL from `lib/site.ts`.
**Since extended:** the gallery rebuild added every `/gallery/[category]` and
`/gallery/[category]/[slug]` URL to the sitemap, derived from `lib/gallery-data.ts`'s
`CATEGORIES`/`GALLERY_IMAGES` rather than hand-listed, so a new Gallery item is picked up
automatically. Regression tests in `test/sitemap.test.ts` and `e2e/seo.spec.ts`.

### D3. Marketing numbers are hand‑entered and unverifiable — **[Investigate]**
`lib/home-data.ts` `TESTIMONIAL_META = { rating: 4.9, count: 18 }` while `TESTIMONIALS`
has 5 entries; the home page renders a hard‑coded 5‑star glyph and "(18 projects)".
Confirm these claims are substantiated (review aggregation) before relying on them
publicly.

---

## E. Theming / UI

### E1. `<html class="dark">` with a light‑only palette — **[Confirmed]**
`app/layout.tsx` hard‑codes `className="dark"`. The active `app/theme-b.css` defines only
a light `:root` token set (no `.dark` block), and `app/globals.css` sets
`color-scheme: light`. Net: the site renders light while Tailwind's `dark:` variant is
permanently active. There is no working dark mode and no toggle — the class is misleading.

### E2. Logo likely low‑contrast on interior pages — **[Investigate]**
`BrandLogo` (`components/Header.tsx`) and `Footer` render `logo-white.png` via
`dark:block` / `logo-black.png` via `dark:hidden`. Because `dark:` is always on (E1), the
**white logo is always shown**. On the home page the header sits over a dark hero image so
it reads; on `/about`, `/faq`, `/shop`, `/contact`, etc. the header background is the
near‑white page background once scrolled, and the footer background is always light.
Verify the white logo is actually visible there.

### E3. `theme-c.css` header comment says `app/theme-b.css` — **[Confirmed]**
`app/theme-c.css:1` is labelled `/* app/theme-b.css */`. Copy‑paste error; harmless but
confusing.

### E4. Modals / menus are not focus‑trapped — **[Confirmed, partially resolved]**
The `GalleryCard.tsx` dialog previously referenced here (Esc + body-scroll lock, no focus
trap) **no longer exists** — the Gallery rebuild removed the click-to-open modal entirely
in favor of real project pages (`/gallery/[category]/[slug]`), so that specific concern is
moot. `Header.tsx`'s mobile menu is still a plain toggled `<div>` with no focus trap or
focus return on close — that part of this item remains accurate.

### E5. Inconsistent `prefers-reduced-motion` detection pattern between components — **[Confirmed]**
`components/Hero.tsx` (rebuilt for the rotating hero) detects `prefers-reduced-motion` via
`useSyncExternalStore` against `window.matchMedia` — deliberately chosen because a plain
`useMemo`/`useEffect`+`useState` read can leave a derived value (e.g. a disabled-button
state) stuck on a stale pre-hydration snapshot. `components/TestimonialsCarousel.tsx`
still uses the older `useMemo`-based pattern and was left untouched as out of scope for the
Hero work. The two components can now behave subtly differently around hydration timing
for the same media query. Low severity (no user-visible bug currently observed), but worth
aligning `TestimonialsCarousel` to the newer pattern if it's touched again.

---

## F. Commerce

### F1. Shopify Buy Button SDK loaded from `latest` (unpinned) — **[Deferred 2026-09-04]**
`components/shopify/ShopifyProductBuyButton.tsx:5` and
`components/shopify/buyButtonUI.ts:4` load
`.../buy-button/latest/buy-button-storefront.min.js`. Shopify can change the embed's
markup/behavior at any time. The quantity‑persistence workaround
(`persistedQty` + `afterRender`/`updateQuantity` DOM poking, `ShopifyProductBuyButton.tsx:65-108,289-307`)
is coupled to current SDK internals and could break on an SDK update.

**Decision (2026-09-04): stay unpinned, do not pin the version at this time — monitor
instead.** Context that led to this call:

- Shopify deprecated the **Checkout APIs** that the underlying JS Buy SDK depended on,
  with a hard deadline (mid‑2025) after which purchases would fail on outdated builds.
  Shopify shipped a final SDK major version (v3.0+) that swaps the internals to the newer
  **Cart APIs** to keep functioning. Buy Button JS itself (the widget this site embeds)
  is **not** deprecated as a product — Shopify's current docs still list it as the
  supported way to embed a buy button on a non‑Shopify site — but it explicitly states
  **"this SDK isn't supported by Shopify support."**
- Because this repo loads the CDN `.../latest/...` build rather than a pinned version, the
  site silently picked up the Cart‑API‑based fix with no code change and no deploy —
  checkout never broke. That is very likely *why* this integration has been stable through
  a deprecation cycle that broke pinned/outdated integrations elsewhere.
- Pinning to a specific version would trade that "auto‑inherits Shopify's future fixes"
  behavior for predictability — but predictability only pays off if someone actually
  watches Shopify's Buy Button JS / JS Buy SDK changelog and bumps the pin when needed.
  No one is currently doing that, so pinning now would risk *removing* the safety net
  (auto‑fix) without replacing it with the thing that makes pinning safe (active
  monitoring) — likely a net negative for a small site with no dedicated ops capacity.
- Business value of pinning today is effectively zero (stability only, no visible
  feature); revisit only if it's bundled into other work already touching this component
  (see below), or if evidence emerges that `latest` broke something.

**What "monitor instead" means going forward:**
- Periodically confirm add‑to‑cart / checkout still works on the PDP (`/shop/[slug]`) —
  no fixed cadence has been set; this is currently informal, not a scheduled check.
- Watch for Shopify announcing another breaking change to Buy Button JS / the Cart API
  (Shopify's developer changelog: `shopify.dev/changelog`) — since Shopify support does
  not cover this SDK, a future breaking change would surface as a silent failure (empty
  or broken CTA on the PDP, per F2) rather than a warning.
- **Bundle a version pin in opportunistically**, not as a standalone task — specifically,
  if `ShopifyProductBuyButton.tsx` is touched for another reason (e.g. a future per‑variant
  image feature was scoped and shelved as low‑impact/high‑uncertainty — see project notes),
  pin to whatever version is manually verified working at that time rather than pinning
  blindly now.

### F2. No visible fallback when the Buy Button fails to render — **[Confirmed]**
Missing `NEXT_PUBLIC_SHOPIFY_*` vars or a script‑load failure results in `console.warn` /
`console.error` and an empty CTA area on the PDP (`ShopifyProductBuyButton.tsx:114-128`).
A shopper sees a product page with no way to buy and no message. Consider a "Buy on
Shopify" link fallback.

### F3. Local price strings can drift from Shopify — **[Confirmed / Investigate]**
`data/products.json` carries `price_display` strings (`"$45"`, `"$175 - $290"`, …) that
are rendered on `/shop` and the PDP header, while the actual price shown in the Buy Button
comes live from Shopify. Nothing keeps them in sync. Confirm current values are correct
and consider sourcing price from Shopify only.

### F4. Product sort mishandles range prices — **[Confirmed]**
`app/shop/page.tsx` `toPriceNumber("$175 - $290")` → strips to `"175-290"` →
`Number(...)` → `NaN` → `+Infinity`, so any range‑priced product always sorts last
regardless of its real price. Currently affects `large-endgrain-board`.

### F5. `Product.status` union has an unhandled value — **[Confirmed]**
`types/product.ts` allows `"made_to_order"`, but neither `ProductCard` nor the PDP handles
it (they only special‑case `"coming-soon"`). A product with `status: "made_to_order"`
would be treated as not‑purchasable and, if `status !== "available"`, sorted after
available items — with no badge. All current data is `"available"`, so this is latent.

### F6. `variants.options` in `products.json` is not reconciled with Shopify — **[Investigate]**
`hasVariants()` only checks that `variants.options` is a non‑empty array; the actual
option/variant list rendered comes from Shopify via `shopify_product_id`. If Shopify's
variants for `large-endgrain-board` differ from `["Maple","Cherry","Walnut"]`, the site
gives no indication. The `shopify_handle` field on that record is also read via a cast and
isn't in the `Product` type.

### F7. Hardcoded, mismatched Storefront API versions — **[Confirmed]**
`app/api/shopify/product/route.ts` pins `2024-10`; `app/api/shopify/cart/route.ts` pins
`2024-04`. Both will eventually be removed by Shopify's version sunset policy. (Both
routes are currently dead — see B1 — but the versions still matter if revived.)

---

## G. Build / tooling / ops

### G1. `scripts/optimize-images.mjs` depends on an undeclared package — **[Confirmed]**
It `import`s `sharp`, which is not in `package.json`. It works today only because Next.js
pulls `sharp` in transitively (`package-lock.json` shows `sharp ^0.34.4` as a Next
optional dep). If Next drops/changes that, the script breaks. Add `sharp` to
`devDependencies`.

### G2. No `.env.example` — **[Confirmed]**
The required environment set must be reverse‑engineered from the code. See
`INTEGRATIONS.md` for the authoritative list.

### G3. Duplicated base‑URL env vars — **[Confirmed]**
`NEXT_PUBLIC_SITE_URL` (metadata) and `SITE_URL` (verification links) are separate and can
disagree; a mismatch produces wrong canonical URLs or broken confirmation links.

### G4. No security headers — **[Confirmed]**
`next.config.ts` is empty. No CSP, `X-Frame-Options`, `Referrer-Policy`, `HSTS`, or
`Permissions-Policy`. The site embeds third‑party scripts (shopifycdn, optionally GTM) and
iframes (YouTube) with no CSP constraining them.

### G5. No tests, no CI — **[Resolved]**
A Vitest unit/API suite (`test/`) and a Playwright e2e suite (`e2e/`) now exist, along with
`.github/workflows/ci.yml` (push to `main` + PRs: lint → test → build → e2e). See
`docs/TESTING.md` for coverage. Coverage is a regression safety net, not exhaustive — several
items in this document (A3, A4, A5, F4) are deliberately asserted as *current* behavior in
tests, with a note to flip the assertion if/when they're fixed.

### G6. Bleeding‑edge dependency versions — **[Investigate]**
Next 16.0.10, React 19.2.1, Tailwind 4, `eslint-config-next` 16. Verify production
stability and third‑party compatibility; expect churn on upgrades.

### G7. Redundant / re‑committed image assets — **[Confirmed]**
The working tree adds spaced‑name `.webp` files (e.g. `"Bar shelving.webp"`) that
duplicate existing hyphenated ones (`Bar-shelving.webp`) referenced by the code. Pick one
convention; the duplicates inflate the deployment.

### G8. `.env` present on disk with real values — **[Confirmed, currently contained]**
`.env` exists locally and is matched by `.gitignore` (`.env*`); `git ls-files` confirms it
is **not** tracked. Keep it that way — never `git add -f` it. Rotate any credential that
has been shared outside secure channels.

---

## H. Miscellaneous / low priority

- **H1 [Confirmed]** `app/api/shopify/cart/route.ts:12` error string misspells
  `SHOPIFY_STOREFRRONT_ACCESS_TOKEN`; comments in `app/api/contact/route.ts` reference a
  `RESEND_FROM` var the code doesn't use (it uses `EMAIL_FROM`).
- **H2 [Confirmed]** `next/image` is used with local `src` values with no existence guard.
  A typo in `lib/gallery-data.ts` / `data/products.json` / `app/about/page.tsx` yields a
  runtime 404 for that image with no fallback. (Spot-checked at various points across the
  Gallery/Hero/Shop-preview work as new entries were added; the referenced-file count has
  grown well past the original ~13 and isn't tracked as a fixed number.)
- **H3 [Confirmed]** `components/TestimonialsCarousel.tsx:43` disables
  `react-hooks/exhaustive-deps`; `clampIndex` is recreated each render and referenced in
  an effect — currently benign. See also E5 (this component's older
  `prefers-reduced-motion` pattern vs. `Hero.tsx`'s newer one).
- **H4 [Resolved]** Previously: Home "Featured work" items and `ProjectCard` links pointed
  at routes with no per-item detail (`/gallery2`, `/projects/[slug]`). Since resolved
  independently on both sides: the Home page's "Featured work" section was replaced by a
  Shop preview linking to real `/shop/[slug]` detail pages, and the Gallery rebuild gave
  every Gallery item a real `/gallery/[category]/[slug]` detail page. The residual half of
  this item — `components/ProjectCard.tsx` itself is still dead code, still linking to a
  `/projects/[slug]` route that doesn't exist — remains tracked under B3 (it was never a
  live link on any rendered page, so nothing user-facing was ever broken by it).
- **H5 [Investigate]** `app/about/page.tsx` workshop strip lists `Working-pic-2.jpg` /
  `Working-pic-3.jpg` (JPEG) while `.webp` versions of the same names also exist in
  `public/images/projects/`; confirm the intended asset.
- **H6 [Resolved 2026-09-14]** Server‑side `message` previously had no maximum length (A5).
  Now capped at `MAX_MESSAGE_LENGTH` (4000, matching the client) in
  `app/api/contact/route.ts`.

---

## I. Gallery content

### I1. Some Gallery categories are thin — **[Investigate]**
As of the current 23-entry catalog (`lib/gallery-data.ts`), category sizes are uneven —
e.g. "Commercial Projects" has only 2 items, and "Cutting Boards" has 4 (1 original entry
plus 3 that intentionally reuse Shop product photography — see `FEATURES.md` §2). A
thin category page is a weaker landing experience and a thinner indexable page for SEO
than a fuller one. Not a defect — the content simply reflects what photography exists
today — but worth flagging for the client: more photos in under-represented categories
would directly improve both.

### I2. A handful of unreviewed/ambiguous source photos were left out of the Gallery — **[Investigate]**
During the Gallery data-modeling work, a small number of candidate photos in
`public/images/projects/` (e.g. a baptismal font variant, a couple of bar/shelving shots,
a barnwood side-table shot) were ambiguous enough — near-duplicates, unclear subject, or
unclear category — that they were left out of `GALLERY_IMAGES` rather than guessed at.
They were never deleted, just not catalogued. Revisit with the client if a fuller Gallery
is wanted; low urgency since nothing user-facing depends on them.
